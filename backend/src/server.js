require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("=========================================");
    console.log("🚀 MUN Buddy Backend Started");
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log("=========================================");
});