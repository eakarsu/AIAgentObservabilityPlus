const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'traces', fields: ['project_name','span_count','status','duration_ms','started_at'] });
