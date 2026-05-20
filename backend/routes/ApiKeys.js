const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'api_keys', fields: ['project_name','key_prefix','label','last_used','status'] });
