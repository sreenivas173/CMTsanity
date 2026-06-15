import fs from 'fs';
import {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    ImageRun
} from 'docx';

export async function generatePotDocument(
    suiteName: string,
    testName: string
) {

    const jsonPath =
        `POT/${suiteName}/${testName}/steps.json`;

    const steps =
        JSON.parse(
            fs.readFileSync(
                jsonPath,
                'utf8'
            )
        );

    const children = [];

    children.push(
        new Paragraph({
            text: testName,
            heading: HeadingLevel.TITLE
        })
    );

    for (const step of steps) {

        children.push(
            new Paragraph({
                text: step.title,
                heading: HeadingLevel.HEADING_1
            })
        );

        children.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data:
                            fs.readFileSync(
                                step.imagePath
                            ),
                        transformation: {
                            width: 600,
                            height: 350
                        }
                    })
                ]
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                children
            }
        ]
    });

    const buffer =
        await Packer.toBuffer(doc);

    fs.mkdirSync(
        `Documents/${suiteName}`,
        { recursive: true }
    );

    fs.writeFileSync(
        `Documents/${suiteName}/${testName}.docx`,
        buffer
    );

    console.log(
        `POT document created: Documents/${suiteName}/${testName}.docx`
    );
}
