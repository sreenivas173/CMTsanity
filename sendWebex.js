const fs = require("fs");
const https = require("https");

const d2cReportUrl = `https://sreenivas173.github.io/CMTsanity/d2c/`;
const mmReportUrl  = `https://sreenivas173.github.io/CMTsanity/mm/`;

// 🔍 Parse Playwright JSON report
function getSummary() {
  let total = 0, passed = 0, failed = 0, skipped = 0;
  let passedTests = [];
  let failedTests = [];

  try {
    const data = JSON.parse(fs.readFileSync("report.json", "utf-8"));

    function parseSuite(suite) {
      suite.specs?.forEach(spec => {
        spec.tests.forEach(test => {
          total++;
          const result = test.results[0];

          if (result.status === "passed") {
            passed++;
            passedTests.push(spec.title);
          } else if (result.status === "failed") {
            failed++;
            failedTests.push(spec.title);
          } else if (result.status === "skipped") {
            skipped++;
          }
        });
      });

      suite.suites?.forEach(parseSuite);
    }

    parseSuite(data);

  } catch (err) {
    console.error("❌ Error reading report:", err.message);
  }

  return { total, passed, failed, skipped, passedTests, failedTests };
}

// 📩 Send message to Webex
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      roomId: process.env.WEBEX_ROOM_ID,
      markdown: message
    });

    const options = {
      hostname: "webexapis.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WEBEX_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = "";

      res.on("data", chunk => body += chunk);

      res.on("end", () => {
        console.log(`📡 Webex Status: ${res.statusCode}`);
        if (res.statusCode === 200) resolve();
        else {
          console.error("❌ Webex Error:", body);
          reject(body);
        }
      });
    });

    req.on("error", err => {
      console.error("❌ Request Error:", err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// 🚀 Main execution
(async () => {
  try {
    const summary = getSummary();

    const runUrl = process.env.GITHUB_RUN_URL || "";

    // 🌐 Static HTML report URL (GitHub Pages)
    const htmlReportUrl = `https://sreenivas173.github.io/CMTsanity/`;

    // 📦 Artifact link
    const artifactUrl = process.env.GITHUB_RUN_URL
      ? `${process.env.GITHUB_RUN_URL}#artifacts`
      : "";

    const maxItems = 5;

    const failedList = summary.failedTests.slice(0, maxItems)
      .map(t => `- ❌ ${t}`).join("\n");

    const passedList = summary.passedTests.slice(0, maxItems)
      .map(t => `- ✅ ${t}`).join("\n");

    const moreFailed = summary.failedTests.length > maxItems
      ? `\n...and ${summary.failedTests.length - maxItems} more`
      : "";

    const morePassed = summary.passedTests.length > maxItems
      ? `\n...and ${summary.passedTests.length - maxItems} more`
      : "";

    // 📝 Final message
    const message = `
🚀 **Playwright Sanity Report**

📊 **Summary**
- Total: ${summary.total}
- Passed: ${summary.passed} ✅
- Failed: ${summary.failed} ❌
- Skipped: ${summary.skipped}

${summary.failed > 0 ? `
❌ **Failed Tests**
${failedList}${moreFailed}
` : "🎉 **All tests passed successfully!**"}

${summary.passed > 0 ? `
✅ **Sample Passed Tests**
${passedList}${morePassed}
` : ""}

🌐 **View HTML Report (Recommended):**
- 🔹 **D2C Report:**  
${d2cReportUrl}

- 🔹 **MM Report:**  
${mmReportUrl}

🔗 **View Run:**
${runUrl}

📦 **Download Report ZIP:**
${artifactUrl || "Check artifacts in run page"}
`;

    // 📩 Send to Webex
    await sendMessage(message);

  } catch (err) {
    console.error("❌ Script failed:", err);
    process.exit(1);
  }
})();