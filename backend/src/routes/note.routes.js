const express = require("express");
const noteController = require("../controllers/noteController");
const { authenticate, requireRole, requireOwnNote } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const noteValidation = require("../validations/noteValidation");

const router = express.Router();

router.post("/", authenticate, requireRole("delegate"), validateBody(noteValidation.create), noteController.create);
router.get("/mine", authenticate, requireRole("delegate"), noteController.listMine);
router.put(
    "/:id", authenticate, requireRole("delegate"), requireOwnNote,
    validateBody(noteValidation.update), noteController.update
);
router.delete("/:id", authenticate, requireRole("delegate"), requireOwnNote, noteController.remove);

module.exports = router;
