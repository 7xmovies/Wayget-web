import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Terminal, 
  Sparkles,
  Zap,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { GatewayConfig } from '../types';

interface TelegramBotGeneratorProps {
  config: GatewayConfig | null;
}

export const TelegramBotGenerator: React.FC<TelegramBotGeneratorProps> = ({ config }) => {
  const [botToken, setBotToken] = useState<string>('7182938192:AAExampleTokenHere');
  const [productName, setProductName] = useState<string>('VIP Trading Signals Access');
  const [productPrice, setProductPrice] = useState<string>('199');
  const [framework, setFramework] = useState<'node-telegram-bot-api' | 'telegraf'>('node-telegram-bot-api');
  const [copied, setCopied] = useState<boolean>(false);

  const merchantUpi = config?.merchantUpiId || 'yuvraj@fam';
  const merchantName = config?.merchantName || 'Apex Digital Store';
  const gmail = config?.gmail || 'your_alerts_email@gmail.com';

  const generateCode = () => {
    if (framework === 'node-telegram-bot-api') {
      return `/**
 * FamPay Automated Payment Verification Telegram Bot
 * Powered by fampay-verify (https://www.npmjs.com/package/fampay-verify)
 * 
 * Dependencies:
 *   npm install node-telegram-bot-api fampay-verify dotenv
 */

import TelegramBot from 'node-telegram-bot-api';
import { FamPayVerifier } from 'fampay-verify';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '${botToken}';
const MERCHANT_UPI = process.env.MERCHANT_UPI || '${merchantUpi}';
const MERCHANT_NAME = process.env.MERCHANT_NAME || '${merchantName}';
const GMAIL_ACCOUNT = process.env.GMAIL_ACCOUNT || '${gmail}';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'your_16_digit_app_password';

// Initialize FamPay Verifier
const verifier = new FamPayVerifier({
  gmail: GMAIL_ACCOUNT,
  gmailAppPassword: GMAIL_APP_PASSWORD,
});

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Track active orders: userId -> { amount, orderId, timerId }
const activeOrders = new Map();

console.log('🤖 FamPay Telegram Verification Bot is running...');

// /start command
bot.onText(/\\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    \`👋 Welcome to \${MERCHANT_NAME}!\\n\\n\` +
    \`📦 Product: *${productName}*\\n\` +
    \`💰 Price: *₹${productPrice}*\\n\\n\` +
    \`Type /buy to generate an instant dynamic FamPay / UPI payment QR code.\`,
    { parse_mode: 'Markdown' }
  );
});

// /buy command - Generates dynamic QR & launches auto-verification loop
bot.onText(/\\/buy/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const basePrice = Number('${productPrice}');

  // Add random unique decimal tag between 0.01 and 0.99 for dynamic verification
  const dynamicOffset = (Math.floor(Math.random() * 98) + 1) / 100;
  const payableAmount = (basePrice + dynamicOffset).toFixed(2);
  const orderId = \`ORD-TG-\${Date.now().toString().slice(-6)}\`;

  bot.sendMessage(chatId, '⏳ Generating your secure UPI Payment QR...');

  try {
    // Generate UPI QR Code via fampay-verify
    const qrResult = await verifier.generateQr({
      upiId: MERCHANT_UPI,
      amount: payableAmount,
      name: MERCHANT_NAME,
      userId: userId,
    });

    // Extract image buffer from base64 data URL
    const base64Data = qrResult.qr_image.replace(/^data:image\\/\\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Send QR Photo to Telegram User
    const caption = 
      \`🧾 *Payment Invoice #\${orderId}*\\n\\n\` +
      \`📦 *Item:* ${productName}\\n\` +
      \`💵 *Exact Amount:* \`₹\${payableAmount}\` *(Do not change decimals!)*\\n\` +
      \`📲 *Payee UPI:* \`\${MERCHANT_UPI}\`\\n\\n\` +
      \`Scan the QR above using *FamPay*, *GPay*, *PhonePe*, or *Paytm*.\\n\` +
      \`Your payment will be automatically verified in seconds! ⚡\\n\\n\` +
      \`⏱️ Valid for 15 minutes.\`;

    await bot.sendPhoto(chatId, imageBuffer, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Pay via UPI App', url: qrResult.upi_uri }],
          [{ text: '🔄 Check Payment Status', callback_data: \`check_\${orderId}\` }],
        ],
      },
    });

    // Start auto-polling verification loop (checks every 8 seconds for up to 12 minutes)
    let attempts = 0;
    const maxAttempts = 90; // ~12 minutes

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        console.log(\`Checking payment for \${payableAmount} (Attempt \${attempts})...\`);

        const verification = await verifier.verifyPayment({
          amount: payableAmount,
          userId: userId,
        });

        if (verification.verified) {
          clearInterval(pollInterval);
          activeOrders.delete(userId);

          // Success message
          await bot.sendMessage(
            chatId,
            \`🎉 *PAYMENT VERIFIED SUCCESSFULLY!*\\n\\n\` +
            \`✅ *Amount Received:* ₹\${verification.amount}\\n\` +
            \`👤 *Sender:* \${verification.sender_name || 'UPI User'}\\n\` +
            \`🔖 *UTR:* \`\${verification.utr || 'VERIFIED'}\`\\n\` +
            \`🕒 *Time:* \${verification.payment_time_ist || 'Now'}\\n\\n\` +
            \`🎁 *Here is your delivery:*\\n\` +
            \`👉 Secret VIP Access Link: https://t.me/+SampleVIPInviteSecretKey\\n\` +
            \`Thank you for your business!\`,
            { parse_mode: 'Markdown' }
          );
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          activeOrders.delete(userId);
          bot.sendMessage(
            chatId,
            \`⚠️ Payment session for #\${orderId} has expired. If you paid, use /verify \${orderId} <UTR> to claim.\`
          );
        }
      } catch (err) {
        console.error('Polling error:', err.message);
      }
    }, 8000);

    activeOrders.set(userId, { orderId, payableAmount, pollInterval });
  } catch (err) {
    bot.sendMessage(chatId, \`❌ Error generating QR: \${err.message}\`);
  }
});

// Manual UTR submission fallback: /verify <12-digit-UTR>
bot.onText(/\\/verify (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const utr = match[1].trim();

  if (utr.length < 8) {
    return bot.sendMessage(chatId, '❌ Please provide a valid 12-digit UTR reference number.');
  }

  bot.sendMessage(chatId, \`🔍 Verifying UTR \${utr} in bank records...\`);

  try {
    const result = await verifier.verifyPayment({
      amount: Number('${productPrice}'),
      utr: utr,
    });

    if (result.verified) {
      bot.sendMessage(
        chatId,
        \`🎉 *UTR Verified!* Access granted.\\nVIP Link: https://t.me/+SampleVIPInviteSecretKey\`,
        { parse_mode: 'Markdown' }
      );
    } else {
      bot.sendMessage(chatId, \`❌ Could not verify UTR \${utr}. Reason: \${result.message || 'Not found yet'}\`);
    }
  } catch (err) {
    bot.sendMessage(chatId, \`❌ Verification error: \${err.message}\`);
  }
});
`;
    } else {
      return `/**
 * FamPay Automated Payment Verification Bot (Telegraf Edition)
 * Powered by fampay-verify (https://www.npmjs.com/package/fampay-verify)
 */

import { Telegraf, Markup } from 'telegraf';
import { FamPayVerifier } from 'fampay-verify';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '${botToken}');
const verifier = new FamPayVerifier({
  gmail: process.env.GMAIL_ACCOUNT || '${gmail}',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || 'your_app_password',
});

bot.command('start', (ctx) => {
  ctx.replyWithMarkdown(
    \`*Welcome to ${merchantName}*\\n\\nUse /buy to pay ₹${productPrice} via FamPay/UPI.\`
  );
});

bot.command('buy', async (ctx) => {
  const dynamicOffset = (Math.floor(Math.random() * 95) + 1) / 100;
  const amount = (Number('${productPrice}') + dynamicOffset).toFixed(2);

  const qr = await verifier.generateQr({
    upiId: '${merchantUpi}',
    amount,
    name: '${merchantName}',
  });

  const buffer = Buffer.from(qr.qr_image.replace(/^data:image\\/\\w+;base64,/, ''), 'base64');

  await ctx.replyWithPhoto(
    { source: buffer },
    {
      caption: \`Pay exact ₹\${amount} using any UPI app.\\n\\nAuto-verifying your payment... ⚡\`,
      ...Markup.inlineKeyboard([[Markup.button.url('🚀 Open in UPI App', qr.upi_uri)]]),
    }
  );

  // Poll for verification
  let timer = setInterval(async () => {
    const res = await verifier.verifyPayment({ amount });
    if (res.verified) {
      clearInterval(timer);
      ctx.reply(\`🎉 Verified! Received ₹\${res.amount}. Here is your product!\`);
    }
  }, 7000);
});

bot.launch();
`;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([generateCode()], { type: 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = 'fampay_telegram_bot.js';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Telegram Bot Integration Generator
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
              Node.js + fampay-verify
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Export a complete, self-contained Telegram bot that creates dynamic QR codes, verifies FamPay/UPI payments in the background, and instantly delivers VIP channels, licenses, or digital downloads!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Script!' : 'Copy Bot Code'}
          </button>
          <button
            onClick={downloadFile}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download .js File
          </button>
        </div>
      </div>

      {/* Bot Customizer Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Customize Bot Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Telegram Bot Token</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product / Service Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. VIP Subscription"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Price (₹ INR)</label>
            <input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="199"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Library Framework</label>
            <select
              value={framework}
              onChange={(e: any) => setFramework(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            >
              <option value="node-telegram-bot-api">node-telegram-bot-api (Standard)</option>
              <option value="telegraf">telegraf (Modern Middleware)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-200">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-slate-400">fampay-telegram-bot.mjs</span>
          </div>
          <span className="text-[11px] text-slate-400">Node.js ES Module</span>
        </div>

        <pre className="p-6 text-xs font-mono overflow-x-auto leading-relaxed text-slate-300">
          <code>{generateCode()}</code>
        </pre>
      </div>

      {/* Quick Setup Instructions */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">How to Run Your Telegram Bot</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">1. Install Dependencies</span>
            <code className="bg-slate-100 p-1.5 rounded block text-[11px] font-mono text-slate-800">
              npm install fampay-verify node-telegram-bot-api dotenv
            </code>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">2. Set Environment Variables</span>
            <p className="text-slate-600">
              Create a <code className="font-mono">.env</code> file with your Telegram Bot Token and Gmail App Password.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">3. Start the Bot</span>
            <code className="bg-slate-100 p-1.5 rounded block text-[11px] font-mono text-slate-800">
              node fampay_telegram_bot.js
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
