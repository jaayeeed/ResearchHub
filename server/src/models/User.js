const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalize, tokenize } = require('../utils/text');

const { Schema } = mongoose;

const ROLES = ['student', 'thesis_student', 'researcher', 'professor'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    level: { type: String, enum: SKILL_LEVELS, default: 'intermediate' },
  },
  { _id: true }
);

const educationSchema = new Schema(
  {
    degree: { type: String, trim: true, maxlength: 100, required: true },
    institution: { type: String, trim: true, maxlength: 120, required: true },
    field: { type: String, trim: true, maxlength: 100 },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
  },
  { _id: true }
);

const labelArray = (max) => ({
  type: [{ type: String, trim: true, maxlength: 60 }],
  default: [],
  validate: { validator: (v) => v.length <= max, message: `A maximum of ${max} items is allowed` },
});

const userSchema = new Schema(
  {
    // ---- FR-01: account & academic profile ----
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    headline: { type: String, trim: true, maxlength: 140, default: '' },
    bio: { type: String, trim: true, maxlength: 1500, default: '' },
    institution: { type: String, trim: true, maxlength: 120, default: '' },
    department: { type: String, trim: true, maxlength: 120, default: '' },
    designation: { type: String, trim: true, maxlength: 80, default: '' },
    location: { type: String, trim: true, maxlength: 80, default: '' },
    education: { type: [educationSchema], default: [] },
    links: {
      website: { type: String, trim: true, maxlength: 200, default: '' },
      googleScholar: { type: String, trim: true, maxlength: 200, default: '' },
      orcid: { type: String, trim: true, maxlength: 40, default: '' },
      researchGate: { type: String, trim: true, maxlength: 200, default: '' },
      linkedin: { type: String, trim: true, maxlength: 200, default: '' },
      github: { type: String, trim: true, maxlength: 200, default: '' },
    },
    settings: {
      showEmail: { type: Boolean, default: false },
      openToCollaborate: { type: Boolean, default: true },
    },

    // Profile picture is stored inside MongoDB (not the server disk) so it
    // survives redeploys on ephemeral hosts like Render (Reliability NFR).
    avatar: {
      data: { type: Buffer, select: false },
      contentType: { type: String, select: false },
      size: { type: Number, select: false },
      updatedAt: { type: Date },
    },

    // ---- FR-02: skills, interests, expertise & domains ----
    skills: {
      type: [skillSchema],
      default: [],
      validate: { validator: (v) => v.length <= 40, message: 'A maximum of 40 skills is allowed' },
    },
    researchDomains: labelArray(15),
    interests: labelArray(30),
    expertise: labelArray(20),

    // Normalised copies used for fast, case-insensitive search & matching
    norm: {
      skills: { type: [String], default: [], select: false },
      researchDomains: { type: [String], default: [], select: false },
      interests: { type: [String], default: [], select: false },
      expertise: { type: [String], default: [], select: false },
      tokens: { type: [String], default: [], select: false },
      institution: { type: String, default: '', select: false },
    },

    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

// ---- Indexes (Performance & Scalability NFR) ----
userSchema.index({ 'norm.researchDomains': 1 });
userSchema.index({ 'norm.skills': 1 });
userSchema.index({ 'norm.interests': 1 });
userSchema.index({ 'norm.expertise': 1 });
userSchema.index({ 'norm.institution': 1 });
userSchema.index({ 'norm.tokens': 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// Keep normalised fields in sync with the display fields
userSchema.pre('save', function syncNorm(next) {
  this.set('norm.skills', this.skills.map((s) => normalize(s.name)));
  this.set('norm.researchDomains', this.researchDomains.map(normalize));
  this.set('norm.interests', this.interests.map(normalize));
  this.set('norm.expertise', this.expertise.map(normalize));
  this.set('norm.institution', normalize(this.institution));
  this.set('norm.tokens', tokenize([
    ...this.researchDomains,
    ...this.interests,
    ...this.expertise,
    ...this.skills.map((s) => s.name),
  ]));
  next();
});

// Hash password with bcrypt (Security NFR)
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Token was issued before the password changed -> reject it. */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIat) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIat;
};

userSchema.virtual('avatarUrl').get(function avatarUrl() {
  if (!this.avatar || !this.avatar.updatedAt) return null;
  return `/api/users/${this._id}/avatar?v=${this.avatar.updatedAt.getTime()}`;
});

/** How complete the profile is (0-100), shown on the dashboard. */
userSchema.virtual('profileCompleteness').get(function completeness() {
  const checks = [
    !!this.headline,
    !!this.bio,
    !!this.institution,
    !!this.department,
    !!(this.avatar && this.avatar.updatedAt),
    (this.education || []).length > 0,
    (this.researchDomains || []).length > 0,
    (this.skills || []).length >= 3,
    (this.interests || []).length >= 3,
    (this.expertise || []).length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
});

/** Shape returned to the owner of the profile. */
userSchema.methods.toPrivateJSON = function toPrivateJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isAdmin: this.isAdmin,
    headline: this.headline,
    bio: this.bio,
    institution: this.institution,
    department: this.department,
    designation: this.designation,
    location: this.location,
    education: this.education,
    links: this.links,
    settings: this.settings,
    avatarUrl: this.avatarUrl,
    skills: this.skills,
    researchDomains: this.researchDomains,
    interests: this.interests,
    expertise: this.expertise,
    profileCompleteness: this.profileCompleteness,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/** Shape returned to other users — email hidden unless the owner allows it (Security NFR). */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  const data = this.toPrivateJSON();
  delete data.isAdmin;
  delete data.settings;
  delete data.profileCompleteness;
  if (!this.settings || !this.settings.showEmail) delete data.email;
  data.openToCollaborate = this.settings ? this.settings.openToCollaborate : true;
  return data;
};

/** Compact card shape for search results & recommendations. */
userSchema.statics.toCard = function toCard(u) {
  return {
    id: u._id,
    name: u.name,
    role: u.role,
    headline: u.headline,
    institution: u.institution,
    department: u.department,
    designation: u.designation,
    avatarUrl:
      u.avatar && u.avatar.updatedAt
        ? `/api/users/${u._id}/avatar?v=${new Date(u.avatar.updatedAt).getTime()}`
        : null,
    researchDomains: u.researchDomains || [],
    skills: (u.skills || []).map((s) => ({ name: s.name, level: s.level })),
    interests: u.interests || [],
    expertise: u.expertise || [],
    openToCollaborate: u.settings ? u.settings.openToCollaborate !== false : true,
  };
};

userSchema.statics.ROLES = ROLES;
userSchema.statics.SKILL_LEVELS = SKILL_LEVELS;

module.exports = mongoose.model('User', userSchema);
