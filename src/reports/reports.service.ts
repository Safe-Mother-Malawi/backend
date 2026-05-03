import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { UsersService } from '../users/users.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    private readonly analyticsService: AnalyticsService,
    private readonly activityLog: ActivityLogService,
    private readonly usersService: UsersService,
  ) {}

  async generate(dto: GenerateReportDto, generatedBy: User): Promise<Report> {
    // Collect data snapshot based on report type
    let data: Record<string, unknown> = {};

    try {
      if (dto.type === 'District Summary' && dto.district) {
        data = await this.analyticsService.getDistrictStats(dto.district) as Record<string, unknown>;
      } else if (dto.type === 'Risk Report') {
        const [distribution, highRisk] = await Promise.all([
          this.analyticsService.getRiskDistribution(),
          this.analyticsService.getHighRiskCases(),
        ]);
        data = { distribution, highRisk };
      } else {
        data = await this.analyticsService.getOverview() as Record<string, unknown>;
      }
    } catch {
      data = { generatedAt: new Date().toISOString() };
    }

    const name = `${dto.type} — ${dto.district ?? 'National'} — ${new Date().toLocaleDateString('en-GB')}`;

    const report = this.repo.create({
      name,
      type: dto.type,
      format: dto.format,
      district: dto.district ?? null,
      dateFrom: dto.dateFrom ?? null,
      dateTo: dto.dateTo ?? null,
      data,
      generatedById: generatedBy.id,
    });

    const saved = await this.repo.save(report);

    await this.activityLog.log({
      action: ActivityAction.RISK_SUBMITTED, // reuse closest action
      actorId: generatedBy.id,
      description: `Report generated: ${name}`,
      resourceType: 'report',
      resourceId: saved.id,
    });

    return saved;
  }

  async findAll(user: User, district?: string): Promise<Report[]> {
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.generatedBy', 'generatedBy')
      .orderBy('r.createdAt', 'DESC');

    if (user.role === UserRole.DHO) {
      // DHO sees only their own reports
      qb.where('r.generatedById = :uid', { uid: user.id });
    } else {
      // Admin can filter by district
      if (district) qb.where('r.district = :district', { district });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.repo.findOne({ where: { id }, relations: ['generatedBy'] });
    if (!report) throw new NotFoundException('Report not found.');
    return report;
  }

  async archive(id: string): Promise<Report> {
    await this.repo.update(id, { status: ReportStatus.ARCHIVED });
    return this.findOne(id);
  }

  async delete(id: string, user: User): Promise<void> {
    const report = await this.findOne(id);
    // DHO can only delete their own reports
    if (user.role === UserRole.DHO && report.generatedById !== user.id) {
      throw new ForbiddenException('You can only delete your own reports.');
    }
    await this.repo.remove(report);
  }

  // ── Data Export ───────────────────────────────────────────────────────────

  async exportData(opts: {
    format: string;
    dataType: string;
    district?: string;
    dateRange: string;
  }): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    // Gather data based on type
    const rows = await this._gatherExportRows(opts.dataType, opts.district, opts.dateRange);
    const timestamp = new Date().toISOString().substring(0, 10);
    const baseName = `${opts.dataType.replace(/\s+/g, '_')}_${timestamp}`;

    const fmt = (opts.format ?? 'CSV').toUpperCase();

    if (fmt === 'JSON') {
      const buffer = Buffer.from(JSON.stringify(rows, null, 2), 'utf-8');
      return { buffer, filename: `${baseName}.json`, mimeType: 'application/json' };
    }

    if (fmt === 'PDF') {
      const buffer = await this._exportPdf(rows, opts.dataType, timestamp);
      return { buffer, filename: `${baseName}.pdf`, mimeType: 'application/pdf' };
    }

    // CSV (also used for Excel — client saves as .xlsx but content is CSV-compatible)
    const csv = this._toCsv(rows);
    const buffer = Buffer.from(csv, 'utf-8');
    if (fmt === 'EXCEL') {
      return { buffer, filename: `${baseName}.csv`, mimeType: 'text/csv' };
    }
    return { buffer, filename: `${baseName}.csv`, mimeType: 'text/csv' };
  }

  private async _gatherExportRows(
    dataType: string,
    district?: string,
    dateRange?: string,
  ): Promise<Record<string, unknown>[]> {
    const since = this._dateRangeStart(dateRange ?? 'All time');

    // Use activity logs as the primary data source — covers all event types
    const logs = await this.activityLog.findAll({ since, limit: 5000 });

    let filtered = logs;
    if (dataType !== 'All Data') {
      const typeMap: Record<string, string[]> = {
        'User Activity':       ['user.'],
        'Clinician Data':      ['patient.', 'risk.', 'alert.'],
        'Health Assessments':  ['risk.'],
        'System Events':       ['user.', 'alert.'],
        'Login History':       ['user.login', 'user.logout'],
      };
      const prefixes = typeMap[dataType] ?? [];
      if (prefixes.length > 0) {
        filtered = logs.filter(l => prefixes.some(p => l.action.startsWith(p)));
      }
    }

    return filtered.map(l => ({
      id:          l.id,
      timestamp:   l.createdAt,
      action:      l.action,
      actor:       l.actor?.fullName ?? 'System',
      description: l.description ?? '',
      resourceType: l.resourceType ?? '',
      resourceId:  l.resourceId ?? '',
    }));
  }

  private _dateRangeStart(range: string): Date | undefined {
    const now = new Date();
    const map: Record<string, number> = {
      'Last 7 days': 7,
      'Last 30 days': 30,
      'Last 3 months': 90,
      'Last 6 months': 180,
    };
    const days = map[range];
    if (!days) return undefined;
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }

  private _toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return 'No data available\n';
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
    ];
    return lines.join('\r\n');
  }

  private _exportPdf(rows: Record<string, unknown>[], title: string, date: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).font('Helvetica-Bold').text('Safe Mother Malawi — Data Export', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text(`${title} · Generated ${date}`, { align: 'center' });
      doc.moveDown(1);

      if (rows.length === 0) {
        doc.text('No data available for the selected filters.');
        doc.end();
        return;
      }

      const headers = ['#', 'Timestamp', 'Action', 'Actor', 'Description'];
      const colWidths = [30, 130, 130, 110, 350];
      let x = 40;
      const headerY = doc.y;

      // Header row
      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, x, headerY, { width: colWidths[i], ellipsis: true });
        x += colWidths[i];
      });
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(790, doc.y).strokeColor('#1a56db').lineWidth(1).stroke();
      doc.moveDown(0.3);

      // Data rows
      doc.fontSize(8).font('Helvetica');
      rows.slice(0, 200).forEach((row, idx) => {
        if (doc.y > 540) { doc.addPage({ layout: 'landscape' }); }
        x = 40;
        const rowY = doc.y;
        const cells = [
          String(idx + 1),
          String(row['timestamp'] ?? '').substring(0, 19).replace('T', ' '),
          String(row['action'] ?? ''),
          String(row['actor'] ?? ''),
          String(row['description'] ?? ''),
        ];
        cells.forEach((cell, i) => {
          doc.text(cell, x, rowY, { width: colWidths[i] - 4, ellipsis: true });
          x += colWidths[i];
        });
        doc.moveDown(0.5);
      });

      if (rows.length > 200) {
        doc.moveDown(0.5).fontSize(9).fillColor('#9ca3af')
          .text(`... and ${rows.length - 200} more rows (export CSV for full data)`, { align: 'center' });
      }

      doc.end();
    });
  }

  async generatePdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.findOne(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        // Sanitize filename for HTTP header (ASCII printable only, no quotes/backslash)
        const safeFilename = report.name
          .replace(/[^\x20-\x7E]/g, '_')
          .replace(/["\\\r\n]/g, '_');
        resolve({ buffer: Buffer.concat(chunks), filename: `${safeFilename}.pdf` });
      });
      doc.on('error', reject);

      // ── Header ────────────────────────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').text('Safe Mother Malawi', { align: 'center' });
      doc.fontSize(13).font('Helvetica').text('Ministry of Health — Clinical Management System', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a56db').lineWidth(2).stroke();
      doc.moveDown(1);

      // ── Report title ──────────────────────────────────────────────────────
      doc.fontSize(16).font('Helvetica-Bold').text(report.name);
      doc.moveDown(0.4);

      const meta: [string, string][] = [
        ['Type',       report.type],
        ['Format',     report.format],
        ['Status',     report.status],
        ['District',   report.district ?? 'National'],
        ['Generated',  report.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Generated By', report.generatedBy?.fullName ?? 'System'],
      ];

      doc.fontSize(11).font('Helvetica');
      for (const [label, value] of meta) {
        doc.text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value).font('Helvetica');
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(1);

      // ── Data section ──────────────────────────────────────────────────────
      doc.fontSize(14).font('Helvetica-Bold').text('Report Data');
      doc.moveDown(0.6);
      doc.fontSize(10).font('Helvetica');

      if (report.data && typeof report.data === 'object') {
        this._renderObject(doc, report.data, 0);
      } else {
        doc.text('No data available for this report.');
      }

      // ── Footer ────────────────────────────────────────────────────────────
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#9ca3af')
        .text(`Generated on ${new Date().toLocaleString('en-GB')} · Safe Mother Malawi`, { align: 'center' });

      doc.end();
    });
  }

  private _renderObject(doc: PDFKit.PDFDocument, obj: Record<string, unknown>, depth: number): void {
    const indent = depth * 16;
    for (const [key, value] of Object.entries(obj)) {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        doc.font('Helvetica-Bold').text(`${label}:`, { indent });
        doc.font('Helvetica');
        this._renderObject(doc, value as Record<string, unknown>, depth + 1);
      } else if (Array.isArray(value)) {
        doc.font('Helvetica-Bold').text(`${label}:`, { indent });
        doc.font('Helvetica');
        value.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            doc.text(`  ${i + 1}.`, { indent });
            this._renderObject(doc, item as Record<string, unknown>, depth + 2);
          } else {
            doc.text(`  • ${item}`, { indent });
          }
        });
      } else {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true, indent })
           .font('Helvetica').text(String(value ?? '—'));
      }
    }
  }
}
