import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export function clearPotFolder(
    suiteName: string,
    testName: string
) {

    const folder = path.join(
        'POT',
        suiteName,
        testName
    );

    if (fs.existsSync(folder)) {

        fs.rmSync(
            folder,
            {
                recursive: true,
                force: true
            }
        );

    }

}

export interface PotStep {
    title: string;
    imagePath: string;
}


export async function capturePotStep(
    page: Page,
    suiteName: string,
    testName: string,
    stepNo: number,
    stepTitle: string
): Promise<void> {

    const folder = path.join(
        'POT',
        suiteName,
        testName
    );

    fs.mkdirSync(folder, { recursive: true });

    const fileName =
        `${String(stepNo).padStart(2, '0')}_${stepTitle
            .replace(/[^\w]/g, '_')}.png`;

    const imagePath =
        path.join(folder, fileName);

    await page.screenshot({
        path: imagePath,
        fullPage: true
    });

    const jsonFile =
        path.join(folder, 'steps.json');

    let steps: PotStep[] = [];

    if (fs.existsSync(jsonFile)) {
        steps =
            JSON.parse(
                fs.readFileSync(
                    jsonFile,
                    'utf-8'
                )
            );
    }

    steps.push({
        title: stepTitle,
        imagePath
    });

    fs.writeFileSync(
        jsonFile,
        JSON.stringify(
            steps,
            null,
            2
        )
    );
}

