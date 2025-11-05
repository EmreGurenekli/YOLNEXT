/**
 * Export Utilities
 * CSV and Excel export functionality
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
}

/**
 * Export data to CSV
 */
export const exportToCSV = (data: ExportData): void => {
  const { headers, rows, filename = 'export' } = data;
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Add BOM for UTF-8 support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel (XLSX) using SheetJS
 * Note: Requires xlsx library to be installed
 */
export const exportToExcel = async (data: ExportData): Promise<void> => {
  try {
    // Dynamic import of xlsx library
    const XLSX = await import('xlsx');
    const { headers, rows, filename = 'export' } = data;

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const wsData = [
      headers,
      ...rows
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate Excel file
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    // Fallback to CSV if xlsx is not available
    console.warn('Falling back to CSV export');
    exportToCSV(data);
  }
};

/**
 * Format shipment data for export
 */
export const formatShipmentsForExport = (shipments: any[]): ExportData => {
  return {
    headers: [
      'Takip No',
      'Başlık',
      'Toplama Şehri',
      'Teslimat Şehri',
      'Durum',
      'Ağırlık (kg)',
      'Fiyat',
      'Oluşturma Tarihi',
      'Teslimat Tarihi'
    ],
    rows: shipments.map(shipment => [
      shipment.trackingNumber || shipment.trackingCode || '-',
      shipment.title || shipment.productDescription || '-',
      shipment.pickupCity || shipment.from || '-',
      shipment.deliveryCity || shipment.to || '-',
      shipment.status || 'pending',
      shipment.weight || 0,
      shipment.price || 0,
      shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString('tr-TR') : '-',
      shipment.deliveryDate || shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString('tr-TR') : '-'
    ]),
    filename: 'gonderiler'
  };
};

/**
 * Format offers data for export
 */
export const formatOffersForExport = (offers: any[]): ExportData => {
  return {
    headers: [
      'Gönderi ID',
      'Nakliyeci',
      'Fiyat',
      'Tahmini Teslimat',
      'Durum',
      'Tarih'
    ],
    rows: offers.map(offer => [
      offer.shipmentId || '-',
      offer.carrierName || offer.carrier?.name || '-',
      offer.price || 0,
      offer.estimatedDeliveryDays ? `${offer.estimatedDeliveryDays} gün` : '-',
      offer.status || 'pending',
      offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('tr-TR') : '-'
    ]),
    filename: 'teklifler'
  };
};

/**
 * Format payments data for export
 */
export const formatPaymentsForExport = (payments: any[]): ExportData => {
  return {
    headers: [
      'İşlem ID',
      'Tutar',
      'Ödeme Yöntemi',
      'Durum',
      'Tarih',
      'Açıklama'
    ],
    rows: payments.map(payment => [
      payment.transactionId || payment.id || '-',
      payment.amount || 0,
      payment.method || '-',
      payment.status || 'pending',
      payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('tr-TR') : '-',
      payment.description || '-'
    ]),
    filename: 'odemeler'
  };
};

