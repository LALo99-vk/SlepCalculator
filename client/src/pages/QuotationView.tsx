import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Building2 } from 'lucide-react';
import axios from 'axios';
import { downloadQuotationPdf } from '../utils/quotationPdf';

const API_URL = import.meta.env.VITE_API_URL;

const QuotationView: React.FC = () => {
  const { quoteNumber } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (quoteNumber) {
      fetchQuotation(quoteNumber);
    }
  }, [quoteNumber]);

  const fetchQuotation = async (number: string) => {
    try {
      const response = await axios.get(`${API_URL}/quotations/public/${number}`);
      setQuotation(response.data.quotation);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      // Mock data for demo
      setQuotation({
        quoteNumber: 'SLEP/14/2016-25',
        quoteDate: '2026-02-27',
        validUntil: '2026-03-29',
        referenceNumber: '',
        client: {
          name: 'Ace Multi Axes Systems Private Limited: Unit 5.1',
          company: '',
          address: 'Sy.No.53/10, Minnappira,Thumagondala Road\nTaluk.Nelamangala,Bengaluru-562123',
          phone: '',
          email: '',
          gstin: '29AACCA3964A1ZX',
        },
        lineItems: [
          { productName: 'Plastic End Cap 17mm', description: '', quantity: 500, unit: 'Nos', unitPrice: 2.00 },
          { productName: 'Plastic End Cap 19mm', description: '', quantity: 500, unit: 'Nos', unitPrice: 2.25 },
          { productName: 'Plastic End Cap 22mm', description: '', quantity: 500, unit: 'Nos', unitPrice: 2.50 },
          { productName: 'Plastic End Cap 25mm', description: '', quantity: 500, unit: 'Nos', unitPrice: 2.50 },
        ],
        lineSubtotal: 3750.00,
        profitMargin: 15,
        profitAmount: 562.50,
        afterProfit: 4312.50,
        additionalTotal: 0,
        afterAdditional: 4312.50,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 4312.50,
        gstPercent: 18,
        gstType: 'same_state',
        cgst: 387.63,
        sgst: 387.63,
        igst: 0,
        gstAmount: 775.25,
        grandTotal: 5087.75,
        amountInWords: 'Rupees Five Thousand Eighty Seven Only',
        paymentTerms: '30 days',
        deliveryTerms: '10-25 days from PO confirmation',
        notes: 'Terms & Conditions:\n1. The minimum order quantity is 2000 nos.\n2. Product delivery: 10-25 days from PO confirmation.\n3. An 18% GST tax will be added as applicable during move.\n4. Transportation charges will be extra.\n5. Prices vary by payment term. Payment via IMPS/NEFT/RTGS.\n6. Payment is due within 30 days from the invoice date.',
        status: 'sent',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadQuotationPdf(quotation, `${quoteNumber}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quotation Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">The quotation you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-primary-600 mr-2" />
            <span className="text-lg font-semibold">Quotation View</span>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Quotation Content - Styled to match the uploaded format */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header section recreated from quotation design */}
          <div className="px-6 pt-6 pb-3">
            <div className="flex justify-center">
              <img
                src={`/${encodeURIComponent('Sri Lakshmi Engineering Plastics quotation banner.png')}`}
                alt="Sri Lakshmi Engineering Plastics"
                className="h-auto w-full max-w-md object-contain"
              />
            </div>
            <div className="mt-2 flex justify-center">
              <div className="rounded-sm bg-[#1E40AF] px-6 py-1 text-sm font-bold tracking-wide text-white">
                QUOTATION
              </div>
            </div>
          </div>

          {/* Information grid */}
          <div className="p-6">
            <div className="mb-6 grid grid-cols-1 overflow-hidden border border-[#e5e7eb] md:grid-cols-2">
              <div className="border-b border-[#e5e7eb] p-4 md:border-b-0 md:border-r">
                <h3 className="mb-2 text-[32px] font-semibold leading-none text-gray-900">To,</h3>
                <div className="space-y-1 text-sm text-gray-900">
                  <p className="font-medium">{quotation.client.name}</p>
                  {quotation.client.address && (
                    <p className="whitespace-pre-line">{quotation.client.address}</p>
                  )}
                  <p>State Name: Karnataka Code: 29</p>
                  <p>GSTIN No: {quotation.client.gstin || 'Not provided'}</p>
                </div>
              </div>
              <div className="text-sm text-gray-900">
                <div className="flex border-b border-[#e5e7eb]">
                  <div className="w-1/2 p-4 font-medium">Reference No:</div>
                  <div className="w-1/2 p-4 font-medium">{quotation.quoteNumber}</div>
                </div>
                <div className="flex border-b border-[#e5e7eb]">
                  <div className="w-1/2 p-4 font-medium">Date:</div>
                  <div className="w-1/2 p-4">
                    {new Date(quotation.quoteDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/2 p-4 font-medium">Inquiry by:</div>
                  <div className="w-1/2 p-4">Shiva Prasad</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">Dear Sir/Madam,</p>
              <p className="text-sm mb-4"><strong>Sub : Quotation for the plastics end cap</strong></p>
              <p className="text-sm mb-6">
                Good day. With reference to the enquiry, we bo d hereby submit our proposal as following and 
                please do revert back to us at the earliest.
              </p>
            </div>

            {/* Items table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">S.</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Item Description</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">HSN</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">GST</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Qty</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Unit Rate</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.lineItems.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">{item.productName}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">84661010</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">{quotation.gstPercent} %</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">{item.quantity} {item.unit}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">{item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm font-medium">
                        {(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td colSpan={4} className="border border-gray-300 px-4 py-3 text-center text-sm font-bold">
                      Amount in Word: INR {quotation.amountInWords}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold">Total Qty</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold">
                      {quotation.lineItems.reduce((sum: number, item: any) => sum + item.quantity, 0)} Nos
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold">
                      ₹ {quotation.lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total section */}
              <div className="flex">
                <div className="flex-1"></div>
                <div className="w-72">
                  <table className="w-full border-collapse border border-gray-300">
                    <tr className="bg-blue-600 text-white">
                      <td className="border border-gray-300 px-4 py-2 font-semibold text-right">Total Amount for tax</td>
                      <td className="border border-gray-300 px-4 py-2 font-semibold text-right">
                        ₹ {quotation.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {quotation.gstType === 'same_state' ? (
                      <>
                        <tr className="bg-blue-100">
                          <td className="border border-gray-300 px-4 py-2 text-right">CGST {quotation.gstPercent/2}%</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {quotation.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-blue-100">
                          <td className="border border-gray-300 px-4 py-2 text-right">SGST {quotation.gstPercent/2}%</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {quotation.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr className="bg-blue-100">
                        <td className="border border-gray-300 px-4 py-2 text-right">IGST {quotation.gstPercent}%</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {quotation.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-blue-600 text-white">
                      <td className="border border-gray-300 px-4 py-2 font-bold text-right text-lg">Grand Total</td>
                      <td className="border border-gray-300 px-4 py-2 font-bold text-right text-lg">
                        ₹ {quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions :</h3>
              <div className="text-sm space-y-1">
                <p>1. The minimum order quantity is 2000 nos.</p>
                <p>2. Product delivery: 10-25 days from PO confirmation.</p>
                <p>3. An 18% GST tax will be added as applicable during move.</p>
                <p>4. Transportation charges will be extra.</p>
                <p>5. Prices vary by payment term. Payment via IMPS/NEFT/RTGS.</p>
                <p>6. Payment is due within 30 days from the invoice date.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Sri Lakshmi Engineering Plastics</h3>
                <div className="text-xs text-gray-700">
                  <p>S-13,3rd Cross, New Kalappa Block Ramachandrapuram,</p>
                  <p>Bengaluru--560021, GSTIN/UIN*: 29GBPGUD39642PZT2H</p>
                  <p>State Name : Karnataka , Code : 29, Crnptact P4J,</p>
                  <p>+90030555511, E-mail : sleplastics@gmail.com*.+91</p>
                  <p>+90350054151, E-mail :</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-blue-800">DINESH S</span>
                </div>
                <p className="text-sm font-bold">DINESH S</p>
                <p className="text-xs">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationView;