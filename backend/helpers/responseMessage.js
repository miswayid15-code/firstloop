// helpers/responseMessage.js

const requestContext = require("./requestContext");
const { translateMultiple } = require("./translateHelper");

const responseMessage = async (message) => {
    const store = requestContext.getStore();
    const language = store?.language || "en";

    if (language === "en") {
        return message;
    }

    const [translated] = await translateMultiple([message], language);
    return translated;
};

module.exports = responseMessage;