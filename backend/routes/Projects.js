const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'projects', fields: ['name','environment','status','notes'] });
