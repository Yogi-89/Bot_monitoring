import { config } from "dotenv";
import { Computer } from "orgo";
import { createWorker } from 'tesseract.js';
import fs from "fs";
import path from "path";

config();

// ═══════════════════════════════════════════════════════════
//                    KONFIGURASI
// ═══════════════════════════════════════════════════════════
const CONFIG = {
    autoRefreshSeconds: 60,
    tempDir: path.join(process.cwd(), "temp"),
    startIndex: 3  // ← Ubah ini jika mau mulai dari akun ke-N
};

// ═══════════════════════════════════════════════════════════
//                    FUNGSI UTILITY
// ═══════════════════════════════════════════════════════════

function loadAccounts() {
    const accounts = [];
    let idx = CONFIG.startIndex;  // Mulai dari index yang ditentukan
    
    while (true) {
        const key = process.env[`ORGO_KEY_${idx}`];
        const comp = process.env[`ORGO_COMP_${idx}`];
        if (!key || !comp) break;
        accounts.push({ 
            index: idx, 
            key, 
            computerId: comp,
            shortId: comp.substring(0, 12) + "..."
        });
        idx++;
    }
    return accounts;
}

// Extract stats dari OCR text
function extractStats(text) {
    const stats = {
        tasks: "-",
        completed: "-",
        success: "-",
        runtime: "-"
    };

    try {
        const tasksMatch = text.match(/Tasks[:\s]+(\d+)/i);
        if (tasksMatch) stats.tasks = tasksMatch[1];

        const completedMatch = text.match(/Completed[:\s]+(\d+)\s*\/\s*(\d+)/i);
        if (completedMatch) {
            stats.completed = `${completedMatch[1]}/${completedMatch[2]}`;
        }

        const successMatch = text.match(/Success[:\s]+([\d.]+)%/i);
        if (successMatch) {
            stats.success = successMatch[1] + '%';
        }

        const runtimeMatch = text.match(/Runtime[:\s]+([\dhms\s]+)/i);
        if (runtimeMatch) {
            stats.runtime = runtimeMatch[1].trim().replace(/\s+/g, ' ');
        } else {
            const uptimeMatch = text.match(/Uptime[:\s]+([\dhms\s]+)/i);
            if (uptimeMatch) {
                stats.runtime = uptimeMatch[1].trim().replace(/\s+/g, ' ');
            }
        }
    } catch (err) {
        // Return default values
    }

    return stats;
}

// ═══════════════════════════════════════════════════════════
//                    CONNECTION POOL (Koneksi Persistent)
// ═══════════════════════════════════════════════════════════

const computerPool = new Map();

// Koneksi ke computer (hanya sekali, disimpan di pool)
async function getComputer(acc) {
    // Cek apakah sudah ada koneksi
    if (computerPool.has(acc.computerId)) {
        return computerPool.get(acc.computerId);
    }
    
    // Buat koneksi baru
    process.env.ORGO_API_KEY = acc.key;
    const computer = await Computer.create({ computerId: acc.computerId });
    
    // Simpan ke pool
    computerPool.set(acc.computerId, computer);
    
    return computer;
}

// ═══════════════════════════════════════════════════════════
//                    MONITORING FUNCTION
// ═══════════════════════════════════════════════════════════

async function checkAccount(acc, worker) {
    try {
        // Ambil computer dari pool (tidak reconnect!)
        const computer = await getComputer(acc);
        
        // Ambil screenshot (TANPA LOG)
        const screenshot = await computer.screenshot();
        
        // Save temporary untuk OCR
        if (!fs.existsSync(CONFIG.tempDir)) {
            fs.mkdirSync(CONFIG.tempDir, { recursive: true });
        }
        
        const tempFile = path.join(CONFIG.tempDir, `temp_${acc.index}.jpg`);
        fs.writeFileSync(tempFile, Buffer.from(screenshot, "base64"));
        
        // OCR (TANPA LOG)
        const { data: { text } } = await worker.recognize(tempFile);
        
        // Hapus temp file
        fs.unlinkSync(tempFile);
        
        // Extract stats
        const stats = extractStats(text);
        
        return { 
            success: true, 
            account: acc.index,
            shortId: acc.shortId,
            stats: stats,
            status: "ONLINE"
        };

    } catch (err) {
        return { 
            success: false, 
            account: acc.index,
            shortId: acc.shortId,
            error: err.message.substring(0, 20),
            stats: {
                tasks: "-",
                completed: "-",
                success: "-",
                runtime: "-"
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════
//                    DISPLAY FUNCTION
// ═══════════════════════════════════════════════════════════

function displayDashboard(results, runCount) {
    console.clear();
    
    const now = new Date().toLocaleString();
    
    // Header dengan border
    console.log("┌" + "─".repeat(118) + "┐");
    console.log("│" + " ".repeat(47) + "ORGO NODE MONITOR" + " ".repeat(54) + "│");
    console.log("└" + "─".repeat(118) + "┘");
    console.log();
    
    // Info bar
    console.log(`  🕐 Last Update: ${now}  │  🔄 Run: #${runCount}  │  ⏱️  Refresh: ${CONFIG.autoRefreshSeconds}s`);
    console.log();
    
    // Statistik ringkas
    const total = results.length;
    const online = results.filter(r => r.success).length;
    const offline = total - online;
    
    console.log(`  📊 Total: ${total}  │  ✅ Online: ${online}  │  ❌ Offline: ${offline}`);
    console.log();
    
    // Garis pemisah sebelum tabel
    console.log("─".repeat(120));
    console.log();
    
    // Header tabel dengan garis vertikal
    console.log("  📋 ACCOUNT STATUS");
    console.log();
    
    // Header kolom dengan border
    const header = 
        " No.  │ " + 
        "Computer ID".padEnd(18) + " │ " +
        "Status".padEnd(10) + " │ " +
        "Tasks".padEnd(8) + " │ " +
        "Completed".padEnd(12) + " │ " +
        "Success".padEnd(10) + " │ " +
        "Runtime".padEnd(20);
    
    console.log(header);
    console.log("─".repeat(120));
    
    // Tampilkan data
    results.forEach((r) => {
        const num = String(r.account).padStart(3) + ". ";
        const id = r.shortId.padEnd(18);
        
        let statusText;
        if (r.success) {
            statusText = "✅ ONLINE".padEnd(10);
        } else {
            statusText = "❌ OFFLINE".padEnd(10);
        }
        
        const tasks = r.stats.tasks.toString().padEnd(8);
        const completed = r.stats.completed.toString().padEnd(12);
        const success = r.stats.success.toString().padEnd(10);
        const runtime = r.stats.runtime.toString().padEnd(20);
        
        const row = 
            num + "│ " +
            id + " │ " +
            statusText + " │ " +
            tasks + " │ " +
            completed + " │ " +
            success + " │ " +
            runtime;
        
        console.log(row);
    });
    
    console.log("─".repeat(120));
    console.log();
    
    // Footer
    console.log(`  💡 Next refresh in ${CONFIG.autoRefreshSeconds} seconds. Press Ctrl+C to stop.`);
    console.log();
}

// ═══════════════════════════════════════════════════════════
//                    MAIN FUNCTION
// ═══════════════════════════════════════════════════════════

let runCount = 0;
let worker = null;

async function runMonitoring() {
    runCount++;
    
    const accounts = loadAccounts();
    
    if (accounts.length === 0) {
        console.log("❌ Tidak ada akun ditemukan di .env");
        return;
    }
    
    // Ambil data dari semua akun SEKALIGUS (parallel) - TANPA LOG!
    const promises = accounts.map(account => checkAccount(account, worker));
    const results = await Promise.all(promises);
    
    // Tampilkan hasil (hanya dashboard, tidak ada log lain!)
    displayDashboard(results, runCount);
}

async function main() {
    // Initial setup (hanya tampil sekali di awal)
    console.clear();
    console.log("🚀 Starting ORGO Monitor...\n");
    console.log("⏳ Initializing...");
    
    // Init OCR worker
    worker = await createWorker('eng');
    console.log("✅ OCR engine ready!");
    
    const accounts = loadAccounts();
    console.log(`📊 Found ${accounts.length} accounts (starting from #${CONFIG.startIndex})`);
    console.log(`⏱️  Auto-refresh every ${CONFIG.autoRefreshSeconds} seconds\n`);
    
    console.log("🔌 Connecting to all VPS...");
    
    // Koneksi ke semua VPS sekali saja
    for (const acc of accounts) {
        try {
            await getComputer(acc);
            console.log(`   ✅ Connected to account #${acc.index}`);
        } catch (err) {
            console.log(`   ❌ Failed to connect account #${acc.index}: ${err.message}`);
        }
    }
    
    console.log("\n✅ All connections established!\n");
    console.log("Starting monitoring in 3 seconds...\n");
    
    await new Promise(r => setTimeout(r, 3000));
    
    // First run
    await runMonitoring();
    
    // Auto refresh
    if (CONFIG.autoRefreshSeconds > 0) {
        setInterval(async () => {
            await runMonitoring();
        }, CONFIG.autoRefreshSeconds * 1000);
    }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
    console.clear();
    console.log("\n┌" + "─".repeat(50) + "┐");
    console.log("│" + " ".repeat(15) + "MONITOR STOPPED" + " ".repeat(20) + "│");
    console.log("└" + "─".repeat(50) + "┘\n");
    
    // Cleanup OCR
    if (worker) {
        await worker.terminate();
    }
    
    // Cleanup temp folder
    if (fs.existsSync(CONFIG.tempDir)) {
        fs.rmSync(CONFIG.tempDir, { recursive: true });
    }
    
    // Cleanup connections (optional - akan auto cleanup)
    computerPool.clear();
    
    console.log(`  ✅ Total runs completed: ${runCount}`);
    console.log(`  ⏰ Stopped at: ${new Date().toLocaleString()}\n`);
    process.exit(0);
});

main().catch(err => {
    console.error("❌ ERROR:", err);
    process.exit(1);
});