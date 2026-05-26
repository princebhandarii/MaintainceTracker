const Note = require('../models/Note');
const Payment = require('../models/Payment');

exports.addNote = async (req, res) => {
  try {
    const { flatId, year, month, content, noteType } = req.body;
    const flat = await require('../models/Flat').findById(flatId);
    if (!flat) return res.status(404).json({ success: false, message: 'Flat not found' });

    const note = await Note.create({
      flat: flatId,
      flatNumber: flat.flatNumber,
      wing: flat.wing,
      year, month, content,
      noteType: noteType || 'general',
      createdBy: req.user._id,
      createdByName: req.user.name
    });

    // Link note to payment if exists
    await Payment.findOneAndUpdate(
      { flat: flatId, year, month, isDeleted: false },
      { $push: { notes: note._id } }
    );

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotesByFlat = async (req, res) => {
  try {
    const { flatId, year, month } = req.query;
    const filter = { flat: flatId, isDeleted: false };
    if (year) filter.year = parseInt(year);
    if (month) filter.month = parseInt(month);
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    await Note.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
