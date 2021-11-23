const db = require('_helpers/db');
const {Company, User} = db;
require("dotenv").config();
const userService = require('../users/user.service')
const {Roles} = require("../users/user.model");
const {getPasswordHash} = require("../users/user.service");

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    ensureAdmin
};

async function getAll() {
    return await Company.find();
}

async function getById(id) {
    return await Company.findById(id);
}

async function ensureManager(company) {
    let manager = await User.findOne({username: `${company.companyPrefix}@${company.companyPrefix}`})
    if (!manager) {
        manager = await userService.create({
            username: company.companyPrefix,
            role: Roles.Owner,
            password: company.companyPrefix,
            firstName: company.companyName,
            lastName: company.companyPrefix,
            company: company.id
        })
    }
}

async function create(param) {
    if (await Company.findOne({companyPrefix: param.companyPrefix})) {
        throw 'Company "' + param.companyPrefix + '" is already taken';
    }

    const company = new Company(param);
    await company.save();

    await ensureManager(company)
}

async function update(id, param) {
    const company = await Company.findById(id);

    if (!company) throw 'Company not found';
    if (company.companyPrefix !== param.companyPrefix) {
        if (await Company.findOne({companyPrefix: param.companyPrefix})) {
            throw 'Company prefix "' + param.companyPrefix + '" is already taken';
        }
        const companyUsers = await userService.getAllByCompany(company.id)
        for (const companyUser of companyUsers) {
            if (companyUser.role === Roles.Owner || companyUser.role === Roles.Admin){
                companyUser.username = `${company.companyPrefix}@${company.companyPrefix}`
                await companyUser.save()
            }
            else {
                await userService.changeCompany(companyUser.id, company.id)
            }
        }
    }

    Object.assign(company, param);

    await company.save();
}

async function _delete(id) {
    await Company.findByIdAndRemove(id);
}

async function ensureAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin_password'

    const companies = await Company.find({})

    for (const company of companies) {
        await ensureManager(company)
    }

    let adminCompany = await Company.findOne({companyPrefix: adminUsername})
    if (!adminCompany) {
        adminCompany = await create({companyName: 'Admin', companyPrefix: adminUsername})
    }

    const adminUser = await userService.getByName(adminUsername)
    adminUser.role = Roles.Admin
    adminUser.hash = getPasswordHash(adminPassword)
    await adminUser.save()
}