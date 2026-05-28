const fs = require("fs");
const https = require("https");

const d2cReportUrl =
  "https://sreenivas173.github.io/CMTsanity/d2c/";

const mmReportUrl =
  "https://sreenivas173.github.io/CMTsanity/mm/";

// Parse Playwright reports
function getSummary() {

  const summary = {

    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,

    d2c: {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    },

    mm: {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    },

    passedTests: [],
    failedTests: []

  };

  const reports = [

    {
      file:
        "./d2c-report.json",

      module:
        "d2c"
    },

    {
      file:
        "./mm-report.json",

      module:
        "mm"
    }

  ];

  function parseSuite(
    suite,
    moduleName
  ) {

    suite.specs?.forEach(
      spec => {

        spec.tests?.forEach(
          test => {

            summary.total++;

            summary[
              moduleName
            ].total++;

            const result =
              test.results?.[0];

            if (!result)
              return;

            const tcName =
              spec.title;

            summary[
              moduleName
            ].tests.push(
              tcName
            );

            if (
              result.status ===
              "passed"
            ) {

              summary.passed++;

              summary[
                moduleName
              ].passed++;

              summary
                .passedTests
                .push(
                  tcName
                );

            }

            else if (
              result.status ===
              "failed"
            ) {

              summary.failed++;

              summary[
                moduleName
              ].failed++;

              summary
                .failedTests
                .push(
                  tcName
                );

            }

            else if (
              result.status ===
              "skipped"
            ) {

              summary.skipped++;

            }

          }
        );

      }
    );

    suite.suites?.forEach(
      s =>
        parseSuite(
          s,
          moduleName
        )
    );

  }

  reports.forEach(
    r => {

      console.log(
        `Checking:
         ${r.file}`
      );

      if (
        !fs.existsSync(
          r.file
        )
      ) {

        console.log(
          `${r.file}
           NOT FOUND`
        );

        return;

      }

      console.log(
        `${r.file}
         FOUND`
      );

      const data =
        JSON.parse(
          fs.readFileSync(
            r.file,
            "utf8"
          )
        );

      parseSuite(
        data,
        r.module
      );

    }
  );

  return summary;

}

// Send Webex notification
function sendMessage(
  message
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      console.log(
        "WEBEX_TOKEN exists:",
        !!process.env
          .WEBEX_TOKEN
      );

      console.log(
        "WEBEX_ROOM_ID exists:",
        !!process.env
          .WEBEX_ROOM_ID
      );

      console.log(
        "Token preview:",
        process.env
          .WEBEX_TOKEN
          ?.substring(
            0,
            15
          )
      );

      console.log(
        "Room preview:",
        process.env
          .WEBEX_ROOM_ID
          ?.substring(
            0,
            20
          )
      );

      const data =
        JSON.stringify({

          roomId:
            process.env
              .WEBEX_ROOM_ID,

          markdown:
            message

        });

      const options = {

        hostname:
          "webexapis.com",

        path:
          "/v1/messages",

        method:
          "POST",

        headers: {

          Authorization:
            `Bearer ${process.env.WEBEX_TOKEN}`,

          "Content-Type":
            "application/json",

          "Content-Length":
            Buffer.byteLength(
              data
            )

        }

      };

      const req =
        https.request(
          options,
          res => {

            let body =
              "";

            res.on(
              "data",
              chunk =>
                body += chunk
            );

            res.on(
              "end",
              () => {

                console.log(
                  `📡 Webex Status:
                   ${res.statusCode}`
                );

                if (
                  res.statusCode ===
                  200
                ) {

                  resolve();

                }

                else {

                  console.error(
                    "❌ Webex Error:",
                    body
                  );

                  reject(
                    body
                  );

                }

              }
            );

          }
        );

      req.on(
        "error",
        err => {

          console.error(
            err
          );

          reject(
            err
          );

        }
      );

      req.write(
        data
      );

      req.end();

    }
  );

}

// Main execution
(async () => {

  try {

    const summary =
      getSummary();

    const runUrl =
      process.env
        .GITHUB_RUN_URL
      || "";

    const message = `
🚀 **CMT QA1_Env Sanity Report**

📊 **Overall Summary**
• Total: ${summary.total}
• Passed: ${summary.passed} ✅
• Failed: ${summary.failed} ❌
• Skipped: ${summary.skipped}

📁 **D2C Summary**
• Total: ${summary.d2c.total}
• Passed: ${summary.d2c.passed}
• Failed: ${summary.d2c.failed}

📁 **MM Summary**
• Total: ${summary.mm.total}
• Passed: ${summary.mm.passed}
• Failed: ${summary.mm.failed}

✅ **D2C Test Cases**
${summary.d2c.tests
  .slice(0,10)
  .map(
    t =>
      `• ${t}`
  )
  .join("\n")}

✅ **MM Test Cases**
${summary.mm.tests
  .slice(0,10)
  .map(
    t =>
      `• ${t}`
  )
  .join("\n")}

🌐 D2C Report:
${d2cReportUrl}

🌐 MM Report:
${mmReportUrl}

🔗 Run:
${runUrl}
`;

    await sendMessage(
      message
    );

  }

  catch (err) {

    console.error(
      "❌ Script failed:",
      err
    );

    process.exit(
      1
    );

  }

})();