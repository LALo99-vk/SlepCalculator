import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  topHeader: {
    width: '100%',
    marginBottom: 6,
    backgroundColor: '#ffffff',
    padding: 0,
    height: 112,
    overflow: 'hidden',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
    backgroundColor: '#f0fdfa',
  },
  logo: {
    width: 58,
    height: 58,
    marginRight: 10,
  },
  companyBlock: {
    flex: 1,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  companySubtitle: {
    fontSize: 10,
    marginTop: 3,
    color: '#7f1d1d',
    fontWeight: 700,
  },
  companyLine: {
    fontSize: 9,
    marginTop: 2,
  },
  quotationBand: {
    backgroundColor: '#0f766e',
    paddingVertical: 4,
  },
  quotationBandText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center center',
  },
  infoRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  infoLeft: {
    width: '58%',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    padding: 8,
  },
  infoRight: {
    width: '42%',
    padding: 0,
  },
  infoTitle: {
    fontWeight: 700,
    marginBottom: 4,
  },
  kvRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  kvLabel: {
    width: '45%',
    fontWeight: 700,
  },
  kvValue: {
    width: '55%',
    fontWeight: 700,
  },
  section: {
    marginBottom: 8,
  },
  paraStrong: {
    fontWeight: 700,
    marginBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    fontSize: 9,
  },
  cS: { width: '6%' },
  cDesc: { width: '38%' },
  cHsn: { width: '12%' },
  cGst: { width: '8%' },
  cQty: { width: '10%' },
  cRate: { width: '12%' },
  cAmt: { width: '14%', borderRightWidth: 0 },
  amountTaxRow: {
    flexDirection: 'row',
  },
  amountWords: {
    width: '70%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderTopWidth: 0,
    padding: 8,
  },
  amountBox: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  amountLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  amountGrand: {
    backgroundColor: '#0f766e',
    color: '#ffffff',
    fontWeight: 700,
  },
  termsBox: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderTopWidth: 0,
    padding: 8,
  },
  termsTitle: {
    fontWeight: 700,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sign: {
    alignItems: 'center',
  },
  signName: {
    marginTop: 4,
    fontWeight: 700,
  },
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

type LineItem = {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal?: number;
};

type QuotationPayload = {
  quoteNumber: string;
  quoteDate: string;
  client: {
    name: string;
    address?: string;
    gstin?: string;
  };
  lineItems: LineItem[];
  gstPercent: number;
  gstType: 'same_state' | 'inter_state';
  lineSubtotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  amountInWords: string;
  notes?: string;
};

function QuotationPdfDocument({ quotation }: { quotation: QuotationPayload }) {
  const headerImageUrl = new URL(
    '/slep-quotation-banner-tight.png',
    window.location.origin,
  ).toString();
  const totalQty = quotation.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const notesLines = quotation.notes
    ? quotation.notes.split('\n').filter(Boolean)
    : [
        '1. The minimum order quantity is 2000 nos.',
        '2. Product delivery: 10-25 days from PO confirmation.',
        '3. GST will be added as applicable.',
        '4. Transportation charges will be extra.',
        '5. Prices vary by payment term. Payment via IMPS/NEFT/RTGS.',
      ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topHeader}>
          <Image src={headerImageUrl} style={styles.headerImage} />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoTitle}>To,</Text>
            <Text>{quotation.client?.name || '-'}</Text>
            {!!quotation.client?.address && <Text>{quotation.client.address}</Text>}
            <Text style={{ marginTop: 3 }}>State Name: Karnataka Code: 29</Text>
            <Text>GSTIN No: {quotation.client?.gstin || '-'}</Text>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Reference No:</Text>
              <Text style={styles.kvValue}>{quotation.quoteNumber}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Date:</Text>
              <Text style={styles.kvValue}>{formatDate(quotation.quoteDate)}</Text>
            </View>
            <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.kvLabel}>Inquiry by:</Text>
              <Text style={styles.kvValue}>Shiva Prasad</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.paraStrong}>Dear Sir/Madam,</Text>
          <Text style={styles.paraStrong}>Sub: Quotation for the plastics end cap</Text>
          <Text>
            Good day. With reference to the enquiry, we do hereby submit our proposal as following and
            please do revert back to us at the earliest.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.cS]}>S.</Text>
            <Text style={[styles.cell, styles.cDesc]}>Item Description</Text>
            <Text style={[styles.cell, styles.cHsn]}>HSN</Text>
            <Text style={[styles.cell, styles.cGst]}>GST</Text>
            <Text style={[styles.cell, styles.cQty]}>Qty</Text>
            <Text style={[styles.cell, styles.cRate]}>Unit Rate</Text>
            <Text style={[styles.cell, styles.cAmt]}>Total Amount</Text>
          </View>
          {quotation.lineItems.map((item, index) => {
            const lineTotal = item.lineTotal ?? item.quantity * item.unitPrice;
            return (
              <View style={styles.tableRow} key={`${item.productName}-${index}`}>
                <Text style={[styles.cell, styles.cS]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.cDesc]}>{item.productName}</Text>
                <Text style={[styles.cell, styles.cHsn]}>84661010</Text>
                <Text style={[styles.cell, styles.cGst]}>{quotation.gstPercent}%</Text>
                <Text style={[styles.cell, styles.cQty]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.cell, styles.cRate]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.cell, styles.cAmt]}>{formatCurrency(lineTotal)}</Text>
              </View>
            );
          })}
          <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.cell, styles.cS]} />
            <Text style={[styles.cell, styles.cDesc]} />
            <Text style={[styles.cell, styles.cHsn]} />
            <Text style={[styles.cell, styles.cGst, { fontWeight: 700 }]}>Total Qty</Text>
            <Text style={[styles.cell, styles.cQty, { fontWeight: 700 }]}>{totalQty}</Text>
            <Text style={[styles.cell, styles.cRate]} />
            <Text style={[styles.cell, styles.cAmt, { fontWeight: 700 }]}>
              {formatCurrency(quotation.lineSubtotal)}
            </Text>
          </View>
        </View>

        <View style={styles.amountTaxRow}>
          <View style={styles.amountWords}>
            <Text>
              Amount in Word: INR{' '}
              <Text style={{ fontWeight: 700 }}>{quotation.amountInWords || '-'}</Text>
            </Text>
          </View>
          <View style={styles.amountBox}>
            <View style={styles.amountLine}>
              <Text>Total Amount for tax</Text>
              <Text>{formatCurrency(quotation.taxableAmount)}</Text>
            </View>
            {quotation.gstType === 'same_state' ? (
              <>
                <View style={styles.amountLine}>
                  <Text>CGST {quotation.gstPercent / 2}%</Text>
                  <Text>{formatCurrency(quotation.cgst)}</Text>
                </View>
                <View style={styles.amountLine}>
                  <Text>SGST {quotation.gstPercent / 2}%</Text>
                  <Text>{formatCurrency(quotation.sgst)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.amountLine}>
                <Text>IGST {quotation.gstPercent}%</Text>
                <Text>{formatCurrency(quotation.igst)}</Text>
              </View>
            )}
            <View style={[styles.amountLine, styles.amountGrand, { borderBottomWidth: 0 }]}>
              <Text>Grand Total</Text>
              <Text>{formatCurrency(quotation.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Terms & Conditions:</Text>
          {notesLines.map((line, index) => (
            <Text key={`${line}-${index}`}>{line}</Text>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={{ fontWeight: 700, marginBottom: 3 }}>Sri Lakshmi Engineering Plastics</Text>
            <Text>S-13, 3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021</Text>
            <Text>GSTIN/UIN: 29GBPGUD39642PZT2H | State Name: Karnataka, Code: 29</Text>
            <Text>Contact: +9985055511 | E-mail: sleplastics@gmail.com</Text>
          </View>
          <View style={styles.sign}>
            <Text style={styles.signName}>DINESH S</Text>
            <Text>Authorised Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadQuotationPdf(quotation: QuotationPayload, filename?: string) {
  const blob = await pdf(<QuotationPdfDocument quotation={quotation} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${quotation.quoteNumber || 'quotation'}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
