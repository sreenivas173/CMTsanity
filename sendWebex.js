const fs = require("fs");
const https = require("https");

const d2cReportUrl =
  "https://sreenivas173.github.io/CMTsanity/d2c/";

const mmReportUrl =
  "https://sreenivas173.github.io/CMTsanity/mm/";

// Parse reports
function getSummary() {

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  let passedTests = [];
  let failedTests = [];

  const reports = [
    "./d2c-report.json",
    "./mm-report.json"
  ];

  function parseSuite(suite) {

    suite.specs?.forEach(
      spec => {

        spec.tests?.forEach(
          test => {

            total++;

            const result =
              test.results?.[0];

            if (!result)
              return;

            if (
              result.status ===
              "passed"
            ) {

              passed++;

              passedTests.push(
                spec.title
              );

            } else if (
              result.status ===
              "failed"
            ) {

              failed++;

              failedTests.push(
                spec.title
              );

            } else if (
              result.status ===
              "skipped"
            ) {

              skipped++;

            }

          }
        );

      }
    );

    suite.suites?.forEach(
      parseSuite
    );

  }

  reports.forEach(
    file => {

      console.log(
        `Checking:
         ${file}`
      );

      if (
        !fs.existsSync(
          file
        )
      ) {

        console.log(
          `${file}
           NOT FOUND`
        );

        return;

      }

      console.log(
        `${file}
         FOUND`
      );

      const data =
        JSON.parse(
          fs.readFileSync(
            file,
            "utf8"
          )
        );

      parseSuite(
        data
      );

    }
  );

  return {
    total,
    passed,
    failed,
    skipped,
    passedTests,
    failedTests
  };

}

// Send Webex
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

            let body = "";

            res.on(
              "data",
              chunk =>
                body +=
                chunk
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

                } else {

                  console.error(
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
        reject
      );

      req.write(
        data
      );

      req.end();

    }
  );

}

// Main
(async () => {

  try {

    const summary =
      getSummary();

    const runUrl =
      process.env
        .GITHUB_RUN_URL
      || "";

    const message = `
🚀 Playwright Sanity

Total:
${summary.total}

Passed:
${summary.passed}

Failed:
${summary.failed}

D2C:
${d2cReportUrl}

MM:
${mmReportUrl}

Run:
${runUrl}
`;

    await sendMessage(
      message
    );

  } catch (err) {

    console.error(
      err
    );

    process.exit(
      1
    );

  }

})();