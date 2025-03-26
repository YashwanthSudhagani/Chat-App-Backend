const Poll = require("../models/Poll");

module.exports.createPoll = async (req, res) => {
    const { question, options, createdBy } = req.body;
    const poll = new Poll({
      question,
      options: options.map((opt) => ({ id: opt.id, text: opt.text, votes: 0, voters: [] })),
      createdBy,
    });
    await poll.save();
    io.emit("new_poll", poll); // Emit new poll immediately
    res.json(poll);
  };
  

module.exports.getPolls = async (req, res) => {
  const polls = await Poll.find();
  res.json(polls);
};
