const { TranslationServiceClient } = require("@google-cloud/translate");

const client = new TranslationServiceClient();

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;

const translateText = async (text, targetLanguage = "en") => {
    try {
        if (!text || !targetLanguage || targetLanguage === "en") {
            return text;
        }

        const [response] = await client.translateText({
            parent: `projects/${PROJECT_ID}/locations/global`,
            contents: [text],
            mimeType: "text/plain",
            targetLanguageCode: targetLanguage,
        });

        return response.translations?.[0]?.translatedText || text;
    } catch (error) {
        console.error("Translation Error:", error.message);
        return text;
    }
};

const translateMultiple = async (texts = [], targetLanguage = "en") => {
    try {
        if (!texts.length || !targetLanguage || targetLanguage === "en") {
            return texts;
        }

        // Keep original positions
        const indexedTexts = texts.map((text, index) => ({
            text,
            index
        }));

        // Remove empty/null values before sending to Google
        const validTexts = indexedTexts.filter(
            item =>
                typeof item.text === "string" &&
                item.text.trim() !== ""
        );

        if (validTexts.length === 0) {
            return texts;
        }

        const [response] = await client.translateText({
            parent: `projects/${PROJECT_ID}/locations/global`,
            contents: validTexts.map(item => item.text),
            mimeType: "text/plain",
            targetLanguageCode: targetLanguage,
        });

        // Restore original order
        const result = [...texts];

        response.translations.forEach((translation, i) => {
            result[validTexts[i].index] =
                translation.translatedText;
        });

        return result;
    } catch (error) {
        console.error("Translation Error:", error.message);
        return texts;
    }
};

module.exports = {
    translateText,
    translateMultiple
};