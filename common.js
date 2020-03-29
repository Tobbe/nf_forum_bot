module.exports = {
    getNamedInputValue: function(htmlString, name) {
        const input = htmlString.match(
            new RegExp(`<input .*?name="${name}".*?>`)
        )[0];
        return input.match(/value="([^"]+)"/)[1];
    },
    NF_URL: 'https://rebellion.nerdfitness.com',
    NF_TOPIC_URL: 'https://rebellion.nerdfitness.com/index.php?/topic',
};
