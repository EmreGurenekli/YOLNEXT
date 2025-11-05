/**
 * Export Utilities
 * CSV and Excel export functionality
 */

interface ExportData {
  [key: string]: any;
}

/**
 * Convert data to CSV format
 */
export const exportToCSV = (
  data: ExportData[],
  filename: string = 'export.csv',
  headers?: string[]
): void => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    csvHeaders.join(','),
    // Data rows
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export shipments to CSV
 */
export const exportShipmentsToCSV = (shipments: any[], filename?: string): void => {
  const exportData = shipments.map(shipment => ({
    'Takip No': shipment.trackingNumber || shipment.id,
    'Başlık': shipment.title || shipment.productDescription || '',
    'Kategori': shipment.category || '',
    'Toplama Şehri': shipment.pickupCity || '',
    'Teslimat Şehri': shipment.deliveryCity || '',
    'Toplama Adresi': shipment.pickupAddress || '',
    'Teslimat Adresi': shipment.deliveryAddress || '',
    'Toplama Tarihi': shipment.pickupDate || '',
    'Teslimat Tarihi': shipment.deliveryDate || '',
    'Ağırlık (ton)': shipment.weight || 0,
    'Durum': shipment.status || '',
    'Fiyat (₺)': shipment.price || 0,
    'Oluşturulma': shipment.createdAt || ''
  }));

  exportToCSV(exportData, filename || `gonderiler_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export offers to CSV
 */
export const exportOffersToCSV = (offers: any[], filename?: string): void => {
  const exportData = offers.map(offer => ({
    'Teklif ID': offer.id || '',
    'Gönderi ID': offer.shipmentId || '',
    'Nakliyeci': offer.carrierName || offer.carrierCompany || '',
    'Fiyat (₺)': offer.price || 0,
    'Tahmini Süre (Gün)': offer.estimatedDeliveryDays || '',
    'Mesaj': offer.message || '',
    'Durum': offer.status || '',
    'Tarih': offer.createdAt || ''
  }));

  exportToCSV(exportData, filename || `teklifler_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export to Excel using SheetJS (xlsx library)
 * Note: This requires xlsx library to be installed
 */
export const exportToExcel = async (
  data: ExportData[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Sheet1',
  headers?: string[]
): Promise<void> => {
  try {
    // Dynamic import for xlsx (only load when needed)
    const XLSX = await import('xlsx');
    
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }

    // Get headers
    const excelHeaders = headers || Object.keys(data[0]);
    
    // Prepare worksheet data
    const worksheetData = [
      excelHeaders, // Header row
      ...data.map(row => 
        excelHeaders.map(header => row[header] ?? '')
      )
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = excelHeaders.map(header => ({ wch: Math.max(header.length, 15) }));
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Excel export error:', error);
    // Fallback to CSV if xlsx is not available
    console.warn('Falling back to CSV export');
    exportToCSV(data, filename.replace('.xlsx', '.csv'), headers);
  }
};

/**
 * Export shipments to Excel
 */
export const exportShipmentsToExcel = async (shipments: any[], filename?: string): Promise<void> => {
  const exportData = shipments.map(shipment => ({
    'Takip No': shipment.trackingNumber || shipment.id,
    'Başlık': shipment.title || shipment.productDescription || '',
    'Kategori': shipment.category || '',
    'Toplama Şehri': shipment.pickupCity || '',
    'Teslimat Şehri': shipment.deliveryCity || '',
    'Toplama Adresi': shipment.pickupAddress || '',
    'Teslimat Adresi': shipment.deliveryAddress || '',
    'Toplama Tarihi': shipment.pickupDate || '',
    'Teslimat Tarihi': shipment.deliveryDate || '',
    'Ağırlık (ton)': shipment.weight || 0,
    'Durum': shipment.status || '',
    'Fiyat (₺)': shipment.price || 0,
    'Oluşturulma': shipment.createdAt || ''
  }));

  await exportToExcel(
    exportData,
    filename || `gonderiler_${new Date().toISOString().split('T')[0]}.xlsx`,
    'Gönderiler'
  );
};

/**
 * Export statistics to CSV
 */
export const exportStatsToCSV = (stats: any, filename?: string): void => {
  const exportData = [
    { 'Metrik': 'Toplam Gönderiler', 'Değer': stats.totalShipments || 0 },
    { 'Metrik': 'Teslim Edilenler', 'Değer': stats.deliveredShipments || stats.completedShipments || 0 },
    { 'Metrik': 'Bekleyenler', 'Değer': stats.pendingShipments || 0 },
    { 'Metrik': 'Başarı Oranı (%)', 'Değer': stats.successRate || 0 },
    { 'Metrik': 'Toplam Kazanç (₺)', 'Değer': stats.totalEarnings || stats.totalSpent || 0 },
    { 'Metrik': 'Bu Ay Kazanç (₺)', 'Değer': stats.thisMonthEarnings || stats.thisMonthSpent || 0 }
  ];

  exportToCSV(exportData, filename || `istatistikler_${new Date().toISOString().split('T')[0]}.csv`);
};

