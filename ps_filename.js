function buildPsDestinationFileName(position, templateName, productCode) {
  if (position === '1') {
    return `1-mk${productCode}-a.psd`;
  }

  return `${position}-${templateName}.psd`;
}

module.exports = { buildPsDestinationFileName };
