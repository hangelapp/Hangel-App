#!/usr/bin/env node

/**
 * Firestore Data Import Script
 * Imports vakıflar and dernekler data from Excel files
 *
 * Usage: node import-firestore-data.js
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: Firebase service account key not found at', serviceAccountPath);
  console.error('Please place your Firebase service account JSON file there.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Normalize values from Excel (handle "-", empty strings, etc.)
 */
function normalizeValue(val) {
  if (val === '-' || val === '' || val === null || val === undefined) return null;
  return val;
}

/**
 * Parse date string (YYYY-MM-DD format from Excel)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return admin.firestore.Timestamp.fromDate(date);
  } catch {
    return null;
  }
}

/**
 * Import Vakıflar data from Excel
 */
async function importVakiflar() {
  console.log('\n=== Importing Vakıflar Data ===');

  const filePath = 'C:\\Users\\Alp Tek Bilişim\\Downloads\\(asıl) vakıflar.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} records`);

  let count = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const row of data) {
    const vakifRef = db.collection('ngos').doc();

    const vakifData = {
      name: normalizeValue(row['VAKIF ADI']),
      type: 'vakıf',
      address: normalizeValue(row['ADRES']),
      city: normalizeValue(row['İL']),
      district: normalizeValue(row['İLÇE']),
      phone1: normalizeValue(row['TELEFON-1']),
      phone2: normalizeValue(row['TELEFON-2']),
      eNotificationAddress: normalizeValue(row['E-TEBLİGAT ADRESİ']),
      email: normalizeValue(row['E-POSTA']),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(vakifRef, vakifData);
    count++;
    batchCount++;

    // Firestore batch write limit is 500
    if (batchCount === 500) {
      await batch.commit();
      console.log(`  Committed ${count} records...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Final commit
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✓ Successfully imported ${count} vakıflar records`);
}

/**
 * Import Dernekler data from Excel
 */
async function importDernekler() {
  console.log('\n=== Importing Dernekler Data ===');

  const filePath = 'C:\\Users\\Alp Tek Bilişim\\Downloads\\(asıl) Dernekler son.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} records`);

  let count = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const row of data) {
    const dernekRef = db.collection('ngos').doc();

    const dernekData = {
      sequenceNo: normalizeValue(row['Sıra No']),
      name: normalizeValue(row['Kurum Adı']),
      type: 'dernek',
      activityArea: normalizeValue(row['Faaliyet Alanı']),
      detailedActivityArea: normalizeValue(row['Detaylı Faaliyet Alanı']),
      registryNo: normalizeValue(row['Kütük No']),
      foundedDate: parseDate(row['Kuruluş Tarihi']),
      website: normalizeValue(row['Web Site']),
      address: normalizeValue(row['Kurum Adresi']),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(dernekRef, dernekData);
    count++;
    batchCount++;

    // Firestore batch write limit is 500
    if (batchCount === 500) {
      await batch.commit();
      console.log(`  Committed ${count} records...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Final commit
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✓ Successfully imported ${count} dernekler records`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Firestore data import...');

    await importVakiflar();
    await importDernekler();

    console.log('\n=== Import Complete ===');
    console.log('All data has been successfully imported to Firestore.');

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
