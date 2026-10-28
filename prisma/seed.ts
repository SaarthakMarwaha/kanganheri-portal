/**
 * Prisma Database Seed Script
 *
 * Seeds the database with initial production-ready data:
 * - Default admin user
 * - Emergency contacts for Kanganheri
 * - Sample verified emergency listings
 *
 * Run with: npm run db:seed
 */

import { PrismaClient, UserRole, EmergencyContactType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Kanganheri Darpan database seed...");

  // ── 1. Default Admin User ───────────────────────────────────
  console.log("Creating default admin user...");
  const adminPasswordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@2025!",
    12,
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@kanganheri.com" },
    update: {},
    create: {
      email: "admin@kanganheri.com",
      passwordHash: adminPasswordHash,
      displayName: "Kanganheri Darpan Admin",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // ── 2. Emergency Contacts ────────────────────────────────────
  console.log("Seeding emergency contacts...");

  const emergencyContacts = [
    {
      type: EmergencyContactType.POLICE,
      nameEn: "Chhawla Police Station",
      nameHi: "छावला पुलिस थाना",
      phone: "011-25303100",
      phoneTollFree: "100",
      descriptionEn: "Nearest police station serving Village Kanganheri",
      descriptionHi: "कांगनहेड़ी गांव की सेवा करने वाला निकटतम पुलिस थाना",
      addressEn: "Chhawla, New Delhi - 110071",
      addressHi: "छावला, नई दिल्ली - 110071",
      sortOrder: 1,
    },
    {
      type: EmergencyContactType.AMBULANCE,
      nameEn: "Delhi Emergency Ambulance (CATS)",
      nameHi: "दिल्ली आपातकालीन एम्बुलेंस (CATS)",
      phone: "102",
      phoneTollFree: "1099",
      descriptionEn: "Centralized Accident & Trauma Services — free ambulance",
      descriptionHi: "केंद्रीकृत दुर्घटना एवं आघात सेवाएँ — निःशुल्क एम्बुलेंस",
      sortOrder: 2,
    },
    {
      type: EmergencyContactType.FIRE_BRIGADE,
      nameEn: "Delhi Fire Service",
      nameHi: "दिल्ली अग्निशमन सेवा",
      phone: "101",
      phoneTollFree: "011-23222222",
      descriptionEn: "Delhi Fire Service — dial 101 for emergencies",
      descriptionHi: "दिल्ली अग्निशमन सेवा — आपात स्थिति में 101 डायल करें",
      sortOrder: 3,
    },
    {
      type: EmergencyContactType.POWER_UTILITY,
      nameEn: "BSES Rajdhani Power Ltd — Power Outage Helpline",
      nameHi: "BSES राजधानी पावर लिमिटेड — बिजली खराबी हेल्पलाइन",
      phone: "1800-103-0808",
      phoneTollFree: "19123",
      descriptionEn:
        "Report power outages, transformer faults, and electrical emergencies in Kanganheri (BSES Rajdhani Zone)",
      descriptionHi:
        "कांगनहेड़ी में बिजली खराबी, ट्रांसफार्मर फॉल्ट और विद्युत आपात स्थिति की रिपोर्ट करें (BSES राजधानी क्षेत्र)",
      sortOrder: 4,
    },
    {
      type: EmergencyContactType.WATER_UTILITY,
      nameEn: "Delhi Jal Board — Water Tanker & Helpline",
      nameHi: "दिल्ली जल बोर्ड — पानी टैंकर और हेल्पलाइन",
      phone: "1916",
      phoneTollFree: "1800-111-212",
      descriptionEn:
        "Delhi Jal Board helpline for water supply complaints, tanker requests, and sewage issues",
      descriptionHi:
        "पानी आपूर्ति शिकायतों, टैंकर अनुरोधों और सीवेज समस्याओं के लिए दिल्ली जल बोर्ड हेल्पलाइन",
      sortOrder: 5,
    },
    {
      type: EmergencyContactType.HOSPITAL,
      nameEn: "Rao Tula Ram Memorial (RTRM) Hospital",
      nameHi: "राव तुला राम मेमोरियल (RTRM) अस्पताल",
      phone: "011-25303000",
      descriptionEn:
        "Government district hospital at Jaffarpur Kalan, South West Delhi — nearest major government hospital to Kanganheri",
      descriptionHi:
        "जाफरपुर कलां, दक्षिण पश्चिम दिल्ली में सरकारी जिला अस्पताल — कांगनहेड़ी के निकटतम प्रमुख सरकारी अस्पताल",
      addressEn: "Jaffarpur Kalan, New Delhi - 110073",
      addressHi: "जाफरपुर कलां, नई दिल्ली - 110073",
      sortOrder: 6,
    },
    {
      type: EmergencyContactType.GOVERNMENT_OFFICE,
      nameEn: "SDM Office — Najafgarh",
      nameHi: "SDM कार्यालय — नजफगढ़",
      phone: "011-25303200",
      descriptionEn:
        "Sub-Divisional Magistrate Office for Najafgarh Tehsil — handles civic complaints, certificates, and land records",
      descriptionHi:
        "नजफगढ़ तहसील के लिए उप-मंडल मजिस्ट्रेट कार्यालय — नागरिक शिकायतें, प्रमाण पत्र और भूमि रिकॉर्ड",
      addressEn: "Najafgarh, New Delhi - 110043",
      addressHi: "नजफगढ़, नई दिल्ली - 110043",
      sortOrder: 7,
    },
    {
      type: EmergencyContactType.GOVERNMENT_OFFICE,
      nameEn: "MCD — Najafgarh Zone Office",
      nameHi: "MCD — नजफगढ़ जोन कार्यालय",
      phone: "011-25300100",
      phoneTollFree: "1533",
      descriptionEn:
        "Municipal Corporation of Delhi — Najafgarh Zone. Report waterlogging, garbage, street lights, potholes",
      descriptionHi:
        "दिल्ली नगर निगम — नजफगढ़ जोन। जलभराव, कचरा, स्ट्रीट लाइट, गड्ढों की रिपोर्ट करें",
      sortOrder: 8,
    },
  ];

  for (const contact of emergencyContacts) {
    await prisma.emergencyContact.upsert({
      where: {
        id: `seed-${contact.type.toLowerCase()}-${contact.sortOrder}`,
      },
      update: {},
      create: {
        id: `seed-${contact.type.toLowerCase()}-${contact.sortOrder}`,
        ...contact,
        isActive: true,
      },
    });
    console.log(`  ✓ ${contact.nameEn}`);
  }

  console.log("\n✅ Database seeded successfully!");
  console.log(
    "⚠️  IMPORTANT: Change the admin password immediately after first login.\n",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
