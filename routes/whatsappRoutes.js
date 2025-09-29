// routes/whatsappRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios"); // We'll use axios to make the API call
const { WabaUser, Conversions } = require("../models/wabaUser"); // Import the new WabaUser model

// Your WhatsApp Business API credentials and verification token
const VERIFY_TOKEN = "Rescale@98208";
const ACCESS_TOKEN =
  "EABuMZAfU1Q90BOzFVNe22QijSHvRDn9b7wuUPStl8NmVjcEHe6GQEvmk4glnl3mmnc2xZA97NTAdOZAfujGIOYI8ZBKZCEazjQgZCapZAv3ANPYLWspMMqqcsKyBnuR4ZCzf7ZCCRmmXQsxHTGk0CR1da7BP0YdWe96ZCgzIuIR9VJZBJr65fepHD3CSfEN2MrWUenoqQZDZD";
const WABA_ID = "414582868411503";

// GET endpoint for webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook verification failed.");
    res.sendStatus(403);
  }
});

async function parseCouponMessageAndPostback(message) {
  const regex = /coupon=(\d+)\/(\d+)\/([A-Za-z0-9]+)/;
  const match = message.match(regex);

  if (match) {
    const offer_id = match[1];
    const pid = match[2];
    const click_id = match[3];
    console.log({ offer_id, pid, click_id });

    if (click_id) {
      try {
        const url = `https://offers-eredita.affise.com/postback?goal=3&afstatus=1&clickid=${encodeURIComponent(
          click_id
        )}`;
        const res = await axios.get(url);
        console.log(
          `goal=3 : Postback sent for click_id ${click_id} offer_id ${offer_id} :`,
          res.status
        );
      } catch (err) {
        console.error(
          `Postback failed for click_id ${click_id}:`,
          err.message
        );
      }
    }
    return { offer_id, pid, click_id };
  }else {
    console.log(`${message} is invalid format`);
  }
  return null;
}

// POST endpoint for incoming messages
router.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log("Incoming webhook request:", JSON.stringify(body, null, 2));

  if (
    body &&
    body.object === "whatsapp_business_account" &&
    body.entry &&
    body.entry[0].changes[0].value.messages
  ) {
    const messageData = body.entry[0].changes[0].value.messages[0];
    console.log(messageData);
    
    if(messageData?.text?.body) {
        console.log(` sending goal 3 to affise ${messageData?.text?.body}`);
      await parseCouponMessageAndPostback(messageData?.text?.body);
    }

    const from = messageData.from; // The user's WhatsApp number

    const contactData = body.entry[0].changes[0].value.contacts[0];
    const name = contactData.profile.name;
    const wa_id = contactData.wa_id;

    await saveWabaUserIfNew(from, name, wa_id);

    const replyMessage = `Thank you for connecting with us. Please complete your registration on Fincash by visiting the link below https://www.fincash.com/?utm_source=rescale`;

    sendWhatsAppMessage(from, replyMessage);
  }

  res.sendStatus(200);
});

async function saveWabaUserIfNew(mobile, fullName, wa_id) {
  try {
    const existingUser = await WabaUser.findOne({ mobile: mobile });
    if (!existingUser) {
      const newUser = new WabaUser({
        mobile: mobile,
        fullName: fullName,
        wa_id: wa_id,
      });
      await newUser.save();
      console.log(`✅ New WabaUser saved to DB: ${fullName} (${mobile})`);
    } else {
      console.log(`⚠️ WabaUser already exists: ${fullName} (${mobile})`);
    }
  } catch (error) {
    console.error("❌ Error saving WabaUser to database:", error);
  }
}

async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${WABA_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Automated reply sent successfully:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}



router.get("/convert", async (req, res) => {
  try {
    const cleanParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      cleanParams[key] = Array.isArray(value) ? value[0] : value;
    }

    let { oid, pid, goal, payout, sub1, clid, utm_source, brand,zone,extoid,wurl } = cleanParams;

    if (!pid || !sub1) {
      return res.status(400).json({ error: "Missing required parameters check pid and sub1" });
    }

    if (!goal) goal = "1";
    if (!payout) payout = "0";
    if (!clid) clid = "";
    if (!brand) brand = "rescale";
    if (!zone) zone = "all";

    console.info(
      `convert_api goal = ${goal} zone = ${zone} utm_source = ${utm_source} oid = ${oid} pid = ${pid} payout=${payout} clickid=${clid} sub1=${sub1} extoid = ${extoid} ${wurl}`
    );

    //const msg = `convert sending goal ${goal} utm_source ${utm_source}`;

    const result = await handlePostback({ pid, sub1, payout, goal, utm_source,zone,oid,extoid });

    console.log('convert_api ',result);

    
    /*
    const newConversion = new Conversions({
      offer_id: oid,
      pid: pid,
      click_id: clid,
      sub1: sub1,
      offerName: `Offer-${oid}`,
      goal: goal,
      status: "Completed",
      brand: brand,
      utm_source: utm_source,
      api: {
        status: result.status,
        url: result.url,
        response: result.response,
      },
    });

    if (parseInt(newConversion.pid) === 53) {
      newConversion.affliateName = "AdsTerra";
    } else if (parseInt(newConversion.pid) === 33) {
      newConversion.affliateName = "PropellerAds";
    }

    //const savedRecord = await newConversion.save();
    //console.log("✅ Conversion inserted successfully:", savedRecord);
    */
    //res.json(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track clicks per pid
const clickStats = {}; // { pid: { total: N, converted: M } }

function shouldConvert1(pid,zone) {
const key = `${pid}_${zone}`;
  if (!clickStats[key]) {
    clickStats[key] = { total: 0, converted: 0 };
  }

  const stats = clickStats[key];
  stats.total++;

  // Calculate dynamic CR target based on total clicks
  let targetCR;
  if (stats.total < 10) {
    targetCR = 0; // 0% before 30 clicks
  } else if (stats.total <= 30) {
    targetCR = 0.02; // 30% between 10-30 clicks
  } else {
    targetCR = 0.3 + Math.random() * 0.02; // 2-4% 
  }

  // Rolling CR check (don’t let it overshoot)
  const currentCR = stats.converted / stats.total;
  const zoneStats = {key:key,total: stats.total, conversions: stats.conversions,currentCR: currentCR,targetCR:targetCR};
  console.log(`convert zoneStats : ${zoneStats}`);
  
  if (currentCR > targetCR) {
    return false;
  }

  // Random chance
  const doConvert = Math.random() < targetCR;
  if (doConvert) {
    stats.converted++;
  }
  return doConvert;
}

// Zone stats tracker
let zoneStats = {}; 
// Example: zoneStats[zoneId] = { impressions: 0, conversions: 0, lastConvImps: 0 };



function shouldConvert(pid,zone) {
    const key = `${pid}_${zone}`;
  if (!zoneStats[key]) {
    zoneStats[key] = { impressions: 0, conversions: 0, lastConvImps: 0, minImps: 5 + Math.floor(Math.random() * 3) };
  }

  let stats = zoneStats[key];
  stats.impressions++;

  // Current CR
  let currentCR = stats.conversions / stats.impressions;

  // Randomized target CR per zone between 15–18%
  if (!stats.targetCR) {
    stats.targetCR = (Math.random() * (0.22 - 0.03) + 0.03); 
  }

  // Rule 1: Require 30–50 impressions before first conversion
  if (stats.conversions === 0 && stats.impressions < stats.minImps) {
    console.log(`algo: dropped Rule1 ${key} : Min ${stats.minImps} impressions before conversion impressions = ${stats.impressions} lastConvImps = ${stats.lastConvImps} conversions = ${stats.conversions}`);
    return false;
  }

  // Rule 2: Ensure at least 20 impressions gap since last conversion
  const randomGap = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
  if (stats.conversions > 0 && (stats.impressions - stats.lastConvImps) < randomGap) {
    console.log(`algo: dropped Rule2: ${key}  :Min ${randomGap} impression gap between conversions per zone impressions = ${stats.impressions} lastConvImps = ${stats.lastConvImps} conversions = ${stats.conversions}`);
    return false;
  }

  // Rule 3: If CR is already >= targetCR, stop further conversions
  if (currentCR >= stats.targetCR) {
    console.log(`algo: dropped  Rule3: ${key} : CR already reached currentCR (${currentCR}) >= targetCR ${stats.targetCR} impressions = ${stats.impressions} conversions = ${stats.conversions}`);
    return false;
  }

  // Rule 4: Allow conversion, but ensure zone gets enough conversions
  let minConversions = 5 + Math.floor(Math.random() * 1); // 5–6 conversions minimum
  if (stats.conversions < minConversions || currentCR < stats.targetCR) {
    stats.conversions++;
    stats.lastConvImps = stats.impressions;
    console.log(`algo: successful : ${key} -  CR = ${currentCR} targetCR = ${stats.targetCR} impressions = ${stats.impressions} conversions = ${stats.conversions}`);
    return true; // Conversion ✅
  }

  console.log(`algo: dropped  END: ${key} impressions = ${stats.impressions} conversions = ${stats.conversions}`);
  return false; // Otherwise reject
}


async function handlePostback({ pid, sub1, payout, goal, utm_source,zone,oid,extoid }) {

//oid 260/261 Watcho direct for Nutra hindi/english - Ignore check for should
//Should add brand=fincash also to avoid conversion 271 AdsTerra
let ignoreCheckForOids = ["260", "261","271","279","285"]; 
if (!ignoreCheckForOids.includes(oid) && !shouldConvert(pid,zone)) {
    console.log(`convert Rejected oid=${oid} extoid=${extoid} pid=${pid} zone=${zone} utm_source=${utm_source}`);
    return { status: false, message: `convert Rejected (no conversion) affliateName: ${pid} zone: ${zone}` };
  }
  

  console.log(`convert Successful oid=${oid} pid=${pid} payout=${payout} zone=${zone} utm_source=${utm_source}`);

  let result;
  const msg = `convert Successful goal ${goal} utm_source ${utm_source}`;

  switch (parseInt(pid)) {
    case 53: {
      //const url = `https://www.pbterra.com/code/INR/Adzmonk/at?subid_short=${sub1}&goal=${goal}&atpay=${payout}`;
      const url = `https://www.pbterra.com/code/INR/Adzmonk/at?subid_short=${sub1}`;
      const response = await axios.get(url);
      result = {
        status: true,
        message: msg,
        url,
        response: response.data,
        affliateName: "AdsTerra"
      };
      break;
    }
    case 33: {
      const url = `http://ad.propellerads.com/conversion.php?aid=3603038&pid=&tid=120045&visitor_id=${sub1}&payout=${payout}&goal=${goal}`;
      const response = await axios.get(url);
      result = {
        status: true,
        message: msg,
        url,
        response: response.data,
        affliateName: "PropellerAds"
      };
      break;
    }
    default: {
      result = {
        status: false,
        message: "PID is not supported for external call",
        url: null,
        response: null,
        affliateName: null
      };
      break;
    }
  }

  return result;
}

const db = require("../db");
//TypeError: Cannot read properties of undefined (reading 'collection')
router.post("/carleads", async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      region,
      store,
      utm_source,
      zone,
      sub2,
      oid,
      pid,
      clid,
      sub1,
    } = req.body;

    const z = zone || sub2;

    

    console.log(`carleads START ${mobile} name=${name} mobile=${mobile} email=${email} region=${region} store=${store} utm_source=${utm_source} zone=${z} oid=${oid} pid=${pid} sub1=${sub1}`);

    if (!mobile || !email) {
        console.log(`carleads ${mobile} ! Mobile and Email are required `);
      return res
        .status(400)
        .json({ status:false,message: "Mobile and Email are required" });
    }

    const carleads = db.db.collection("carleads");

    // normalize before checking
    //const normalizedMobile = mobile.replace(/^\+?60/, "").replace(/^0/, "");
    const normalizedMobile = mobile.replace(/^\+?60|^0/, "").replace(/\D/g, "");
    const existing = await carleads.findOne({ normalizedMobile });

    if (existing) {
        console.log(`carleads ${mobile} ! duplicate lead found by mobile `);
        return res.status(400).json({ status:false, message: "Duplicate lead found" });
    }

    const lead = {
      name,
      mobile,
      normalizedMobile,
      email,
      region,
      store,
      utm_source,
      zone : z,
      oid,
      pid,
      clid,
      sub1,
      createdDate: new Date(),
    };

    await carleads.insertOne(lead);

    console.log(`carleads SUCCESS ${mobile} name=${name} mobile=${mobile} email=${email} region=${region} store=${store} utm_source=${utm_source} zone=${z} oid=${oid} pid=${pid} sub1=${sub1}`);

    res.status(200).json({ status:true, message: "Lead saved successfully", lead });
  } catch (err) {
    console.error(`${req.body?.mobile} Error saving lead `,err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// New endpoint: /carleads_gwmora
router.post("/carleads_gwmora", async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      region,
      store,
      utm_source,
      zone,
      sub2,
      oid,
      pid,
      clid,
      sub1,
    } = req.body;

    // Use 'sub2' as a fallback for 'zone'
    const z = zone || sub2;
    
    // The new collection name: gwmoracarleads
    const COLLECTION_NAME = "carleadsgwmora";

    console.log(`carleads_gwmora START ${mobile} name=${name} mobile=${mobile} email=${email} region=${region} store=${store} utm_source=${utm_source} zone=${z} oid=${oid} pid=${pid} sub1=${sub1} collection=${COLLECTION_NAME}`);

    if (!mobile || !email) {
        console.log(`carleads_gwmora ${mobile} ! Mobile and Email are required `);
      return res
        .status(400)
        .json({ status:false,message: "Mobile and Email are required" });
    }

    // *** CHANGE 1: Use the new collection name ***
    const carleadsCollection = db.db.collection(COLLECTION_NAME);

    // normalize before checking
    const normalizedMobile = mobile.replace(/^\+?60|^0/, "").replace(/\D/g, "");
    const existing = await carleadsCollection.findOne({ normalizedMobile });

    if (existing) {
        console.log(`carleads_gwmora ${mobile} ! duplicate lead found by mobile `);
        return res.status(400).json({ status:false, message: "Duplicate lead found" });
    }

    const lead = {
      name,
      mobile,
      normalizedMobile,
      email,
      region,
      store,
      utm_source,
      zone : z,
      oid,
      pid,
      clid,
      sub1,
      createdDate: new Date(),
    };

    await carleadsCollection.insertOne(lead); // *** CHANGE 2: Insert into new collection ***

    console.log(`carleads_gwmora SUCCESS ${mobile} name=${name} mobile=${mobile} email=${email} region=${region} store=${store} utm_source=${utm_source} zone=${z} oid=${oid} pid=${pid} sub1=${sub1} collection=${COLLECTION_NAME}`);

    res.status(200).json({ status:true, message: "Lead saved successfully", lead });
  } catch (err) {
    console.error(`${req.body?.mobile} Error saving lead to carleads_gwmora `,err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
