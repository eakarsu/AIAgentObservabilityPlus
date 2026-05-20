const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'alerts', fields: ['project_name','severity','message','status','fired_at'] });
