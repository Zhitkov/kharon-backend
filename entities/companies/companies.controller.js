const express = require('express');
const router = express.Router();
const service = require('./company.service');
const {checkRole, checkCompanyCompany} = require("../../_helpers/checkers");

const {BasicCrud} = require("../../_helpers/crud");
const {Roles} = require("../users/user.model");

const crud = new BasicCrud(service)

_ = service.ensureAdmin()

router.post('/create', checkRole(Roles.Admin), crud.create);
router.get('/', checkRole(Roles.Admin), crud.getAll);
router.get('/:id', checkCompanyCompany, crud.getById);
router.put('/:id', checkRole(Roles.Admin), crud.update);
router.delete('/:id', checkRole(Roles.Admin), crud._delete);

module.exports = router;
