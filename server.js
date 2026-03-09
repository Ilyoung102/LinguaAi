const app = require('./api/index');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ API Server is running on http://localhost:${PORT}`);
  console.log(`📍 Claude endpoint: POST http://localhost:${PORT}/api/claude`);
  console.log(`📍 OpenAI endpoint: POST http://localhost:${PORT}/api/openai`);
  console.log(`📍 Gemini endpoint: POST http://localhost:${PORT}/api/gemini`);
});
