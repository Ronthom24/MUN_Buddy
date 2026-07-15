const express = require("express");
const documentController = require("../controllers/documentController");
const { authenticate, requireRole, requireOwnDocument } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const documentValidation = require("../validations/documentValidation");

const router = express.Router();

router.post(
    "/", authenticate, requireRole("delegate"),
    validateBody(documentValidation.create), documentController.create
);
router.get("/mine", authenticate, requireRole("delegate"), documentController.listMine);
router.put(
    "/:id", authenticate, requireRole("delegate"), requireOwnDocument,
    validateBody(documentValidation.update), documentController.update
);
router.delete("/:id", authenticate, requireRole("delegate"), requireOwnDocument, documentController.remove);

module.exports = router;
