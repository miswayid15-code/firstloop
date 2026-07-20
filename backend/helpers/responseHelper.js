const { translateMultiple } = require("./translateHelper");

const responseMessage = async (message, language) => {
    if (!language || language === "en") {
        return message;
    }

    const [translated] = await translateMultiple([message], language);
    return translated;
};

module.exports = { responseMessage };