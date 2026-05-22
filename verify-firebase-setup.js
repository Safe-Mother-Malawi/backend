#!/usr/bin/env node

/**
 * Firebase Setup Verification Script
 * Verifies that Firebase is properly configured for push notifications
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentVariable() {
  log('\n1. Checking FIREBASE_SERVICE_ACCOUNT environment variable...', 'blue');

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    log('   ❌ FIREBASE_SERVICE_ACCOUNT not set', 'red');
    return false;
  }

  try {
    const parsed = JSON.parse(serviceAccount);
    log('   ✓ FIREBASE_SERVICE_ACCOUNT is valid JSON', 'green');

    // Check required fields
    const requiredFields = [
      'type',
      'project_id',
      'private_key_id',
      'private_key',
      'client_email',
      'client_id',
      'auth_uri',
      'token_uri',
    ];

    const missingFields = requiredFields.filter((field) => !parsed[field]);

    if (missingFields.length > 0) {
      log(`   ❌ Missing required fields: ${missingFields.join(', ')}`, 'red');
      return false;
    }

    log('   ✓ All required fields present', 'green');
    log(`   ✓ Project ID: ${parsed.project_id}`, 'green');
    log(`   ✓ Client Email: ${parsed.client_email}`, 'green');

    return true;
  } catch (error) {
    log(`   ❌ Invalid JSON: ${error.message}`, 'red');
    return false;
  }
}

function checkDependencies() {
  log('\n2. Checking Firebase dependencies...', 'blue');

  const packageJsonPath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log('   ❌ package.json not found', 'red');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};

  const requiredDeps = {
    'firebase-admin': '^12.0.0',
  };

  let allPresent = true;

  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (dependencies[dep]) {
      log(`   ✓ ${dep}: ${dependencies[dep]}`, 'green');
    } else {
      log(`   ❌ ${dep} not found`, 'red');
      allPresent = false;
    }
  }

  return allPresent;
}

function checkFiles() {
  log('\n3. Checking required files...', 'blue');

  const requiredFiles = [
    'src/push-notifications/push-notifications.service.ts',
    'src/push-notifications/push-notifications.controller.ts',
    'src/push-notifications/push-notifications.module.ts',
    'src/push-notifications/entities/device-token.entity.ts',
    'src/push-notifications/dto/register-device.dto.ts',
    'src/config/firebase.config.ts',
  ];

  let allPresent = true;

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`   ✓ ${file}`, 'green');
    } else {
      log(`   ❌ ${file} not found`, 'red');
      allPresent = false;
    }
  }

  return allPresent;
}

function checkAppModule() {
  log('\n4. Checking app.module.ts integration...', 'blue');

  const appModulePath = path.join(__dirname, 'src/app.module.ts');

  if (!fs.existsSync(appModulePath)) {
    log('   ❌ app.module.ts not found', 'red');
    return false;
  }

  const content = fs.readFileSync(appModulePath, 'utf8');

  const checks = [
    {
      name: 'PushNotificationsModule import',
      pattern: /import.*PushNotificationsModule.*from/,
    },
    {
      name: 'PushNotificationsModule in imports',
      pattern: /PushNotificationsModule,/,
    },
    {
      name: 'DeviceToken entity',
      pattern: /DeviceToken/,
    },
  ];

  let allPresent = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`   ✓ ${check.name}`, 'green');
    } else {
      log(`   ❌ ${check.name} not found`, 'red');
      allPresent = false;
    }
  }

  return allPresent;
}

function checkRemindersIntegration() {
  log('\n5. Checking reminders integration...', 'blue');

  const remindersServicePath = path.join(__dirname, 'src/reminders/reminders.service.ts');

  if (!fs.existsSync(remindersServicePath)) {
    log('   ❌ reminders.service.ts not found', 'red');
    return false;
  }

  const content = fs.readFileSync(remindersServicePath, 'utf8');

  const checks = [
    {
      name: 'PushNotificationsService import',
      pattern: /import.*PushNotificationsService/,
    },
    {
      name: 'PushNotificationsService injection',
      pattern: /private.*pushNotificationsService.*PushNotificationsService/,
    },
    {
      name: 'sendToUser call',
      pattern: /pushNotificationsService\.sendToUser/,
    },
  ];

  let allPresent = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`   ✓ ${check.name}`, 'green');
    } else {
      log(`   ❌ ${check.name} not found`, 'red');
      allPresent = false;
    }
  }

  return allPresent;
}

function printSummary(results) {
  log('\n' + '='.repeat(50), 'blue');
  log('Firebase Setup Verification Summary', 'blue');
  log('='.repeat(50), 'blue');

  const allPassed = Object.values(results).every((r) => r);

  if (allPassed) {
    log('\n✓ All checks passed! Firebase is properly configured.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start the backend: npm run start:dev', 'yellow');
    log('2. Test push notifications with the API', 'yellow');
    log('3. Deploy to production', 'yellow');
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'red');
    log('\nFor help, see: FIREBASE_PUSH_NOTIFICATION_SETUP.md', 'yellow');
  }

  log('\n' + '='.repeat(50) + '\n', 'blue');
}

// Run all checks
function main() {
  log('\n' + '='.repeat(50), 'blue');
  log('Firebase Setup Verification', 'blue');
  log('='.repeat(50), 'blue');

  const results = {
    environmentVariable: checkEnvironmentVariable(),
    dependencies: checkDependencies(),
    files: checkFiles(),
    appModule: checkAppModule(),
    remindersIntegration: checkRemindersIntegration(),
  };

  printSummary(results);

  process.exit(Object.values(results).every((r) => r) ? 0 : 1);
}

main();
