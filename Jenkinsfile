pipeline {
    agent any
    
 parameters {
        string(name: 'TEST_TAG', defaultValue: '@smoke', 
        description: 'Tag to run (e.g., @smoke, @regression)')
    }

    environment {
        PLAYWRIGHT_REPORT_DIR = "playwright-report"
        TEST_RESULTS_DIR = "test-results"
    }
    
    // stages {
    //     stage('Checkout') {
    //         steps {
    //             echo 'Checking out source code...'
    //             checkout scm
    //         }
    //     }


        stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://git.netcracker.com/Personal.TA/Custom_projects/cloud-migration-tools/cmt_playwright_d2c.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Install Playwright Browsers') {
            steps {
                echo 'Installing Playwright browsers...'
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    sh 'npx playwright install --with-deps chromium'
                }
            }
        }
        

        stage('Run Playwright Tests') {
            steps {
                echo 'Running Playwright tests...'
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    sh 'npx playwright test --project=QA1'
                }
            }
        }

        // stage('Run Tagged Tests') {
        //     steps {
        //         sh "npx playwright test --grep ${params.TEST_TAG}"
        //     }
        // }
        
    
        stage('Archive Reports') {
            steps {
                echo 'Archiving test reports...'
                // Find and archive the latest Playwright HTML report
                script {
                    def reportDir = sh(
                        script: "ls -td ${PLAYWRIGHT_REPORT_DIR}/*/ | head -1 | tr -d '\n'",
                        returnStdout: true
                    ).trim()
                    echo "Archiving report from: ${reportDir}"
                    archiveArtifacts artifacts: "${reportDir}**/*", allowEmptyArchive: true
                }
                
                // Archive test results
                script {
                    def testResultDir = sh(
                        script: "ls -td ${TEST_RESULTS_DIR}/*/ | head -1 | tr -d '\n'",
                        returnStdout: true
                    ).trim()
                    echo "Archiving test results from: ${testResultDir}"
                    archiveArtifacts artifacts: "${testResultDir}**/*", allowEmptyArchive: true
                }
            }
        }
        
        stage('Send Email with Report') {
            steps {
                echo 'Sending email with test report...'
                script {
                    // Find the latest report directory
                    def reportDir = sh(
                        script: "ls -td ${PLAYWRIGHT_REPORT_DIR}/*/ | head -1 | tr -d '\n'",
                        returnStdout: true
                    ).trim()
                    
                    def reportPath = "${reportDir}index.html"
                    
                    // Get test summary
                    def testStatus = currentBuild.result ?: 'SUCCESS'
                    def subject = "[Playwright] CMT Automation Test - ${testStatus}"
                    
                    def body = """
                        <html>
                        <body>
                            <h2>D2C Automation Test Results</h2>
                            <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                            <p><b>Job:</b> ${env.JOB_NAME}</p>
                            <p><b>Build Status:</b> <span style="color: ${testStatus == 'SUCCESS' ? 'green' : 'red'}">${testStatus}</span></p>
                            <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                            <p><b>Report Location:</b> ${reportPath}</p>
                            <br>
                            <p>Please find the attached Playwright HTML test report.</p>
                        </body>
                        </html>
                    """
                    
                    // Send email with attachment
                    emailext(
                        subject: subject,
                        body: body,
                        to: 'srinivasa.allamsetti@netcracker.com',  // Configure your recipient email
                        //from: 'jenkins@example.com',   // Configure your sender email
                        attachmentsPattern: "${reportPath}",
                        mimeType: 'text/html'
                    )
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution completed.'
        }
        failure {
            echo 'Pipeline failed. Sending failure notification...'
            script {
                def reportDir = sh(
                    script: "ls -td ${PLAYWRIGHT_REPORT_DIR}/*/ | head -1 | tr -d '\n'",
                    returnStdout: true
                ).trim()
                
                emailext(
                    subject: "[Playwright] CMT Automation Test - FAILED",
                    body: """
                        <html>
                        <body>
                            <h2 style="color: red;">D2C Automation Test FAILED</h2>
                            <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                            <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                            <p>Please check the build logs for more details.</p>
                        </body>
                        </html>
                    """,
                    to: 'srinivasa.allamsetti@netcracker.com',
                   // from: 'jenkins@example.com',
                    mimeType: 'text/html'
                )
            }
        }
    }
}
