import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Material from './models/Material.js';
import Client from './models/Client.js';
import Calculation from './models/Calculation.js';
import Quotation from './models/Quotation.js';
import Settings from './models/Settings.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plastic-production');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Material.deleteMany({});
    await Client.deleteMany({});
    await Calculation.deleteMany({});
    await Quotation.deleteMany({});
    await Settings.deleteMany({});

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@company.com',
        password: 'Admin@123',
        role: 'admin',
        company: 'Sri Lakshmi Engineering Plastics',
        isActive: true
      }
    ]);

    console.log('Users created');

    // Create materials
    const materials = await Material.create([
      {
        name: 'Polypropylene',
        type: 'PP',
        pricePerKg: 95,
        density: 0.9,
        description: 'High quality PP grade for injection molding',
        supplierName: 'Reliance Industries',
        updatedBy: users[0]._id
      },
      {
        name: 'High Density Polyethylene',
        type: 'HDPE',
        pricePerKg: 88,
        density: 0.95,
        description: 'Food grade HDPE material',
        supplierName: 'IOCL',
        updatedBy: users[0]._id
      },
      {
        name: 'Low Density Polyethylene',
        type: 'LDPE',
        pricePerKg: 102,
        density: 0.92,
        description: 'Flexible LDPE for packaging applications',
        supplierName: 'ONGC Petro',
        updatedBy: users[0]._id
      },
      {
        name: 'Acrylonitrile Butadiene Styrene',
        type: 'ABS',
        pricePerKg: 145,
        density: 1.05,
        description: 'Engineering grade ABS plastic',
        supplierName: 'SABIC',
        updatedBy: users[0]._id
      },
      {
        name: 'Nylon 6',
        type: 'Nylon',
        pricePerKg: 210,
        density: 1.14,
        description: 'High strength nylon for automotive parts',
        supplierName: 'DuPont',
        updatedBy: users[0]._id
      }
    ]);

    console.log('Materials created');

    // Create clients
    const clients = await Client.create([
      {
        name: 'Shiva Prasad',
        company: 'Ace Multi Axes Systems Private Limited: Unit 5.1',
        address: 'Sy.No.53/10, Minnappira,Thumagondala Road\nTaluk.Nelamangala,Bengaluru-562123',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562123',
        phone: '+91-9876543210',
        email: 'shiva@acemulti.com',
        gstin: '29AACCA3964A1ZX',
        pan: 'ABCDE1234F',
        notes: 'Regular customer for plastic end caps'
      },
      {
        name: 'Rajesh Kumar',
        company: 'Tech Manufacturing Solutions',
        address: '123 Industrial Area, Phase 2',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91-9876543211',
        email: 'rajesh@techmanuf.com',
        gstin: '27ABCDE1234A1Z5',
        pan: 'FGHIJ5678K',
        notes: 'New client interested in automotive components'
      },
      {
        name: 'Priya Sharma',
        company: 'Green Packaging Ltd',
        address: '456 Eco Park, Sector 15',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        phone: '+91-9876543212',
        email: 'priya@greenpack.com',
        gstin: '27KLMNO5678B2Y6',
        pan: 'LMNOP9012Q',
        notes: 'Eco-friendly packaging solutions'
      }
    ]);

    console.log('Clients created');

    // Create sample calculations
    const calculations = await Calculation.create([
      {
        jobName: 'Plastic End Cap 17mm - Production Run',
        notes: 'Standard production calculation for 17mm end caps',
        mode: 'A',
        inputs: {
          material: 'Polypropylene',
          materialPrice: 95,
          componentWeight: 8.5,
          cavities: 4,
          shortWeight: 2,
          scrapRunnerWeight: 1.5,
          jobWorkCost: 0.50,
          overheadCost: 0.10,
          packingCost: 0.05,
          inputMode: 'material',
          totalMaterial: 25,
          sellingPrice: 2.00
        },
        outputs: {
          costPerGram: 0.095,
          cycleWeight: 37.5,
          componentWeight: 8.5,
          totalMaterialGrams: 25000,
          totalCycles: 666,
          totalPieces: 2664,
          leftoverGrams: 250,
          netPartMaterial: 22644,
          totalShortLoss: 1332,
          totalScrapLoss: 999,
          totalWaste: 2581,
          materialEfficiency: 90.58,
          materialCostPerPiece: 0.8075,
          totalCostPerPiece: 1.4575,
          totalProductionCost: 3883.26,
          piecesPerKg: 106.56,
          costPer1000Pieces: 1457.50
        },
        createdBy: users[0]._id
      },
      {
        jobName: 'HDPE Container Base - Mode B',
        notes: 'Shot-based calculation for container base',
        mode: 'B',
        inputs: {
          material: 'HDPE',
          materialPrice: 88,
          totalShotWeight: 45,
          cavities: 2,
          jobWorkCost: 1.20,
          overheadCost: 0.20,
          packingCost: 0.10,
          inputMode: 'pieces',
          requiredPieces: 1000,
          sellingPrice: 4.50
        },
        outputs: {
          costPerGram: 0.088,
          cycleWeight: 45,
          componentWeight: 22.5,
          totalMaterialGrams: 22500,
          totalCycles: 500,
          totalPieces: 1000,
          leftoverGrams: 0,
          netPartMaterial: 22500,
          totalShortLoss: 0,
          totalScrapLoss: 0,
          totalWaste: 0,
          materialEfficiency: 100,
          materialCostPerPiece: 1.98,
          totalCostPerPiece: 3.48,
          totalProductionCost: 3480,
          piecesPerKg: 44.44,
          costPer1000Pieces: 3480
        },
        createdBy: users[0]._id
      }
    ]);

    console.log('Calculations created');

    // Create sample quotations
    const quotations = await Quotation.create([
      {
        quoteNumber: 'SLEP/14/2016-25',
        quoteDate: new Date('2024-02-27'),
        validUntil: new Date('2024-03-29'),
        referenceNumber: '',
        client: {
          name: clients[0].name,
          company: clients[0].company,
          address: clients[0].address,
          phone: clients[0].phone,
          email: clients[0].email,
          gstin: clients[0].gstin
        },
        lineItems: [
          {
            productName: 'Plastic End Cap 17mm',
            description: '',
            quantity: 500,
            unit: 'Nos',
            unitPrice: 2.00,
            lineTotal: 1000.00
          },
          {
            productName: 'Plastic End Cap 19mm',
            description: '',
            quantity: 500,
            unit: 'Nos',
            unitPrice: 2.25,
            lineTotal: 1125.00
          },
          {
            productName: 'Plastic End Cap 22mm',
            description: '',
            quantity: 500,
            unit: 'Nos',
            unitPrice: 2.50,
            lineTotal: 1250.00
          },
          {
            productName: 'Plastic End Cap 25mm',
            description: '',
            quantity: 500,
            unit: 'Nos',
            unitPrice: 2.50,
            lineTotal: 1250.00
          }
        ],
        lineSubtotal: 4625.00,
        profitMargin: 15,
        profitAmount: 693.75,
        afterProfit: 5318.75,
        additionalCharges: [],
        additionalTotal: 0,
        afterAdditional: 5318.75,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 5318.75,
        gstPercent: 18,
        gstType: 'same_state',
        cgst: 479.69,
        sgst: 479.69,
        igst: 0,
        gstAmount: 959.38,
        grandTotal: 6278.13,
        amountInWords: 'Rupees Six Thousand Two Hundred Seventy Eight Only',
        paymentTerms: '30 days',
        deliveryTerms: '10-25 days from PO confirmation',
        notes: 'Terms & Conditions:\n1. The minimum order quantity is 2000 nos.\n2. Product delivery: 10-25 days from PO confirmation.\n3. An 18% GST tax will be added as applicable during move.\n4. Transportation charges will be extra.\n5. Prices vary by payment term. Payment via IMPS/NEFT/RTGS.\n6. Payment is due within 30 days from the invoice date.',
        status: 'sent',
        linkedCalculationId: calculations[0]._id,
        createdBy: users[0]._id
      },
      {
        quoteNumber: 'SLEP/15/2024-01',
        quoteDate: new Date('2024-01-15'),
        validUntil: new Date('2024-02-15'),
        referenceNumber: 'REF-2024-001',
        client: {
          name: clients[1].name,
          company: clients[1].company,
          address: clients[1].address,
          phone: clients[1].phone,
          email: clients[1].email,
          gstin: clients[1].gstin
        },
        lineItems: [
          {
            productName: 'HDPE Container Base',
            description: 'Heavy duty container base',
            quantity: 1000,
            unit: 'Pcs',
            unitPrice: 4.50,
            lineTotal: 4500.00
          }
        ],
        lineSubtotal: 4500.00,
        profitMargin: 20,
        profitAmount: 900.00,
        afterProfit: 5400.00,
        additionalCharges: [
          {
            label: 'Tooling charges',
            amount: 5000.00
          }
        ],
        additionalTotal: 5000.00,
        afterAdditional: 10400.00,
        discountPercent: 5,
        discountAmount: 520.00,
        taxableAmount: 9880.00,
        gstPercent: 18,
        gstType: 'inter_state',
        cgst: 0,
        sgst: 0,
        igst: 1778.40,
        gstAmount: 1778.40,
        grandTotal: 11658.40,
        amountInWords: 'Rupees Eleven Thousand Six Hundred Fifty Eight Only',
        paymentTerms: '45 days',
        deliveryTerms: '15-20 days from PO confirmation',
        notes: 'Special tooling required for this project.',
        status: 'approved',
        linkedCalculationId: calculations[1]._id,
        createdBy: users[0]._id
      },
      {
        quoteNumber: 'SLEP/16/2024-02',
        quoteDate: new Date('2024-01-20'),
        validUntil: new Date('2024-02-20'),
        referenceNumber: '',
        client: {
          name: clients[2].name,
          company: clients[2].company,
          address: clients[2].address,
          phone: clients[2].phone,
          email: clients[2].email,
          gstin: clients[2].gstin
        },
        lineItems: [
          {
            productName: 'Eco-friendly Food Container',
            description: 'Biodegradable food packaging',
            quantity: 2000,
            unit: 'Pcs',
            unitPrice: 3.25,
            lineTotal: 6500.00
          }
        ],
        lineSubtotal: 6500.00,
        profitMargin: 18,
        profitAmount: 1170.00,
        afterProfit: 7670.00,
        additionalCharges: [],
        additionalTotal: 0,
        afterAdditional: 7670.00,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 7670.00,
        gstPercent: 18,
        gstType: 'same_state',
        cgst: 690.30,
        sgst: 690.30,
        igst: 0,
        gstAmount: 1380.60,
        grandTotal: 9050.60,
        amountInWords: 'Rupees Nine Thousand Fifty Only',
        paymentTerms: '30 days',
        deliveryTerms: '12-18 days from PO confirmation',
        notes: 'Eco-friendly packaging solution as per customer requirements.',
        status: 'draft',
        createdBy: users[0]._id
      }
    ]);

    console.log('Quotations created');

    // Create default settings
    const settings = await Settings.create({
      companyName: 'Sri Lakshmi Engineering Plastics',
      address: 'S-13,3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021',
      phone: '+998055511',
      email: 'sleplastics@gmail.com',
      gstin: '29GBPGUD39642PZT2H',
      cin: '',
      defaultGstPercent: 18,
      defaultProfitMargin: 15,
      currencySymbol: '₹',
      decimalPrecision: 2,
      updatedBy: users[0]._id
    });

    console.log('Settings created');

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@company.com / Admin@123');
    console.log('\nDatabase seeded with:');
    console.log(`- ${users.length} users`);
    console.log(`- ${materials.length} materials`);
    console.log(`- ${clients.length} clients`);
    console.log(`- ${calculations.length} calculations`);
    console.log(`- ${quotations.length} quotations`);
    console.log('- 1 settings record');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();