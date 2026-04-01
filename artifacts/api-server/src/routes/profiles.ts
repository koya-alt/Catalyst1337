router.get("/bot/add-test", (_req, res) => {
  try {
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: "Missing DISCORD_TOKEN env variable",
      });
    }

    const profile = saveProfile(
      "TestBot",
      token,
      "bot1"
    );

    res.json({
      success: true,
      profile,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to add test bot",
    });
  }
});
