const Subject = require('../models/Subject');
const { validationResult } = require('express-validator');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Subject with this code already exists' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get subjects by program ID
// @route   GET /api/subjects/program/:programId
// @access  Private
exports.getSubjectsByProgramId = async (req, res) => {
  try {
    const subjects = await Subject.find({ programId: req.params.programId }).populate('programId', 'name code');
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get subjects by semester
// @route   GET /api/subjects/semester/:semester
// @access  Private
exports.getSubjectsBySemester = async (req, res) => {
  try {
    const subjects = await Subject.find({ semester: req.params.semester }).populate('programId', 'name code');
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('programId', 'name code');
    
    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    res.json(subject);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(subject);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    await subject.remove();

    res.json({ msg: 'Subject removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }
    res.status(500).send('Server error');
  }
};
