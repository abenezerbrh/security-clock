// services/licenseVerification.js
//
// Queries Ontario's PSIS Public Registry directly by license number and
// parses the result. The registry URL pattern accepts a license number
// at the end of the path, so we can hit it server-side without needing
// to physically follow a QR redirect each time.
//
// Example: https://www.compliance.gov.on.ca/services/psis-publicregistry/individual/en/{licenseNumber}

const axios = require('axios');
const cheerio = require('cheerio');

const REGISTRY_BASE_URL =
  'https://www.compliance.gov.on.ca/services/psis-publicregistry/individual/en';

/**
 * Looks up a security license by number against the Ontario PSIS registry.
 *
 * @param {string} licenseNumber - 6-8 digit license number (from QR scan)
 * @returns {Promise<{found: boolean, name?: string, status?: string, category?: string}>}
 */
async function verifyLicense(licenseNumber) {
  const cleaned = String(licenseNumber).trim();

  if (!/^\d{6,8}$/.test(cleaned)) {
    throw new Error('Invalid license number format. Expected 6-8 digits.');
  }

  const url = `${REGISTRY_BASE_URL}/${cleaned}`;

  const response = await axios.get(url, {
    timeout: 8000,
    headers: {
      // A descriptive UA is good practice when hitting a government site
      // programmatically. Replace with your actual company name.
      'User-Agent': 'SecurityClockApp/1.0 (internal staff verification tool)',
    },
  });

  const $ = cheerio.load(response.data);

  // The registry renders results in a table with headers:
  // Licence Number | Licence Status | Licence Category | Licensee
  // We grab the first data row of that table.
  let result = null;

  $('table tr').each((_, row) => {
    const cells = $(row)
      .find('td')
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (cells.length === 4 && /^\d{6,8}$/.test(cells[0])) {
      result = {
        found: true,
        licenseNumber: cells[0],
        status: cells[1],
        category: cells[2],
        name: cells[3],
      };
    }
  });

  if (!result) {
    return { found: false };
  }

  return result;
}

module.exports = { verifyLicense };
