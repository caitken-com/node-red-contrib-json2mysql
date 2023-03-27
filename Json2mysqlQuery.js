/**
 * @description Utility class to convert JSON to mysql
 * @package json2mysql
 * @author Christopher Aitken
 * @version 1.0.0
 */
class Json2mysqlQuery
{
	sql_select;
	sql_insert;
	sql_update;
	sql_delete;
	sql_where;
	sql_joins;
	sql_having;
	sql_group;
	sql_order;
	sql_limit;
	sql_mode;
	sql_params;
	sql_identifiers;
	param_counter;


	/**
	 * @description Resets values
	 * @public
	 * @memberof Json2mysqlQuery
	 * @return {Json2mysqlQuery}
	 */
	constructor()
	{
		this.reset();
	}


	/**
	 * @description Reset query
	 * @public
	 * @memberof Json2mysqlQuery
	 * @return {void}
	 */
	reset()
	{
		this.sql_select = [];
		this.sql_insert = [];
		this.sql_update = [];
		this.sql_delete = [];
		this.sql_where = [];
		this.sql_joins = [];
		this.sql_having = [];
		this.sql_group = [];
		this.sql_order = [];
		this.sql_limit = null;
		this.sql_mode = null;
		this.sql_params = [];
		this.sql_identifiers = [];
		this.param_counter = 0;
	}



	/**
	 * @description Prepares SQL `SELECT` statement
	 * @public
	 * @memberof Json2mysqlQuery
	 * @param {Object} payload
	 * @return {void}
	 */
	select(payload)
	{
		if (!('table' in payload)) throw Error('Select: Missing table');
		if (!('columns' in payload)) throw Error('Select: Missing columns');

		this.sql_mode = 'select';
		this.sql_select = {
			'table': this.table(payload.table),
			'columns': payload.columns,
		};
	}


	/**
	 * @description Prepares SQL `INSERT` statement
	 * @public
	 * @memberof Json2mysqlQuery
	 * @param {Object} payload
	 * @return {void}
	 */
	insert(payload)
	{
		if (!('table' in payload)) throw Error('Insert: Missing table');
		if (!('columns' in payload)) throw Error('Insert: Missing columns');
		if (!('duplicates' in payload)) payload.duplicates = [];

		this.sql_mode = 'insert';
		this.sql_insert = {
			'table': this.table(payload.table),
			'columns': payload.columns,
			'duplicates': payload.duplicates,
		};
	}


	/**
	 * @description Prepares SQL `DELETE` statement
	 * @public
	 * @memberof Json2mysqlQuery
	 * @param {Object} payload
	 * @return {void}
	 */
	delete(payload)
	{
		if (!('table' in payload)) throw Error('Delete: Missing table');

		this.sql_mode = 'delete';
		this.sql_delete = {
			'table': this.table(payload.table),
		};
	}


	/**
	 * @description Prepares SQL `UPDATE` statement
	 * @public
	 * @memberof Json2mysqlQuery
	 * @param {Object} payload
	 * @return {void}
	 */
	update(payload)
	{
		if (!('table' in payload)) throw Error('Update: Missing table');
		if (!('columns' in payload)) throw Error('Update: Missing columns');

		this.sql_mode = 'update';
		this.sql_update = {
			'table': this.table(payload.table),
			'columns': payload.columns,
		};
	}


	/**
	 * @description Prepares SQl `JOIN` statement
	 * @public
	 * @param {Object} payload
	 * @return {void}
	 */
	joins(payload)
	{
		for (let i in payload)
		{
			if (!('type' in payload[i])) throw Error('Joins: Missing type');
			if (!('table' in payload[i])) throw Error('Joins: Missing table');
			if (!('conditions' in payload[i])) throw Error('Joins: Missing conditions');

			this.sql_joins.push({
				'type': payload[i].type,
				'table': this.table(payload[i].table),
				'conditions': payload[i].conditions,
			});
		}
	}


	/**
	 * @description Prepares SQl `ORDER` statement
	 * @public
	 * @param {Object} payload
	 * @return {void}
	 */
	order(payload)
	{
		for (let i in payload)
		{
			this.sql_order.push(payload[i]);
		}
	}


	/**
	 * @description Prepares SQl `GROUP` statement
	 * @public
	 * @param {Object} payload
	 * @return {void}
	 */
	group(payload)
	{
		for (let i in payload)
		{
			this.sql_group.push(payload[i]);
		}
	}


	/**
	 * @description Prepares SQl `WHERE` statement
	 * @public
	 * @param {Object} payload
	 * @return {void}
	 */
	where(payload)
	{
		for (let i in payload)
		{
			this.sql_where.push(payload[i]);
		}
	}


	/**
	 * @description Prepares SQl `HAVING` statement
	 * @public
	 * @param {Object} payload
	 * @return {void}
	 */
	having(payload)
	{
		for (let i in payload)
		{
			this.sql_having.push(payload[i]);
		}
	}


	/**
	 * @description Prepares sql limit statement
	 * @public
	 * @param {number|string|object} val
	 * @returns {void}
	 */
	limit(val)
	{
		let limit = 0;
		let offset = 0;

		switch (typeof val)
		{
			case 'number':
			case 'string':
				limit = parseInt(val);
				break;

			case 'object':
				if (0 in val) offset = parseInt(val[0]);
				if (1 in val) limit = parseInt(val[1]);
				break;
		}

		if (isNaN(limit)) limit = 0;
		if (isNaN(offset)) offset = 0;

		if (offset > 0)
		{
			this.sql_limit = `LIMIT ${offset}, ${limit}\n`;
		}
		else if (limit > 0)
		{
			this.sql_limit = `LIMIT ${limit}\n`;
		}
	}


	/**
	 * @description Prepares sql params
	 * @public
	 * @param {object} params
	 * @returns {void}
	 */
	params(params)
	{
		for (let i in params)
		{
			this.sql_params[i] = params[i];
		}
	}


	/**
	 * @description Generate complete SQL query
	 * @public
	 * @memberof Json2mysqlQuery
	 * @return {string} The query
	 */
	build()
	{
		let query = '';

		switch (this.sql_mode)
		{
			case 'select':
				query += this.buildSelect();

				for (let i in this.sql_joins)
				{
					query += this.buildJoin(this.sql_joins[i]);
				}
				break;

			case 'insert':
				query += this.buildInsert();

				for (let i in this.sql_joins)
				{
					query += this.buildJoin(this.sql_joins[i]);
				}
				break;

			case 'delete':
				query += this.buildDelete();

				for (let i in this.sql_joins)
				{
					query += this.buildJoin(this.sql_joins[i]);
				}
				break;

			case 'update':
				let joins = '';

				for (let i in this.sql_joins)
				{
					joins += this.buildJoin(this.sql_joins[i]);
				}

				query += this.buildUpdate(joins);
				break;

			default:
				throw Error('Unknown query type');
		}

		if (this.sql_where.length > 0) query += this.buildWhere();
		if (this.sql_having.length > 0) query += this.buildHaving();
		if (this.sql_group.length > 0) query += this.buildGroup();
		if (this.sql_order.length > 0) query += this.buildOrder();
		if (this.sql_limit != null) query += this.sql_limit;

		return query;
	}


	/**
	 * @description Build `SELECT` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildSelect()
	{
		let table = null;
		let alias = null;
		let columns = this.processColumns(this.sql_select.columns);
		let query = '';

		if (typeof this.sql_select.table == 'object')
		{
			for (let i in this.sql_select.table)
			{
				table = i;
				alias = this.sql_select.table[i];
			}
		}
		else
		{
			table = this.sql_select.table;
		}

		query += `SELECT ${columns.join(`,\n`)}\n`;
		query += `FROM ${table}${alias ? ` AS ${alias}` : ''}\n`;

		return query;
	}


	/**
	 * @description Build `INSERT` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildInsert()
	{
		let columns = this.processValues(this.sql_insert.columns);
		let cols = [];
		let vals = [];
		let query = '';

		for (let i in columns)
		{
			cols.push(i);
			vals.push(columns[i]);
		}

		query += `INSERT INTO ${this.sql_insert.table} (${cols.join(`, `)})\n`;
		query += `VALUES (${vals.join(', ')})\n`;

		if (this.sql_insert.duplicates.length)
		{
			query += `ON DUPLICATE KEY UPDATE ${this.sql_insert.duplicates.join(`,\n`)}\n`;
		}

		return query;
	}


	/**
	 * @description Build `UPDATE` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string} joins
	 * @returns {string}
	 */
	buildUpdate(joins)
	{
		let table = null;
		let alias = null;
		let columns = this.processValues(this.sql_update.columns);
		let query = '';

		if (typeof this.sql_update.table == 'object')
		{
			for (let i in this.sql_update.table)
			{
				table = i;
				alias = this.sql_update.table[i];
			}
		}
		else
		{
			table = this.sql_update.table;
		}

		query += `UPDATE ${table}${alias ? ` AS ${alias}` : ''}\n`;

		let strings = [];
		for (let i in columns)
		{
			strings.push(`${i} = ${columns[i]}`);
		}

		query += `${joins}SET ${strings.join(`,\n`)}\n`;

		return query;
	}


	/**
	 * @description Build `DELETE` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildDelete()
	{
		let table = null;
		let alias = null;
		let query = '';

		if (typeof this.sql_delete.table == 'object')
		{
			for (let i in this.sql_delete.table)
			{
				table = i;
				alias = this.sql_delete.table[i];
			}
		}
		else
		{
			table = this.sql_delete.table;
		}

		query += `DELETE ${(alias) ? alias : ''}\n`;
		query += `FROM ${table}${(alias) ? ` AS ${alias}` : ''}\n`;

		return query;
	}


	/**
	 * @description Build `JOIN` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string} join
	 * @returns {string}
	 */
	buildJoin(join)
	{
		let table = null;
		let alias = null;
		let conditions = this.processConditions(join.conditions);
		let query = '';

		if (typeof join.table == 'object')
		{
			for (let i in join.table)
			{
				table = i;
				alias = join.table[i];
			}
		}
		else
		{
			table = join.table;
		}

		query += `${String(join.type).toUpperCase()} JOIN ${table}${(alias) ? ` AS ${alias}` : ''}\n`;
		query += `ON ${conditions.join(`\nAND `)}\n`;

		return query;
	}


	/**
	 * @description Build `WHERE` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildWhere()
	{
		let conditions = this.processConditions(this.sql_where);

		return `WHERE ${conditions.join(`\nAND `)}\n`;
	}


	/**
	 * @description Build `HAVING` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildHaving()
	{
		let conditions = this.processConditions(this.sql_having);

		return `HAVING ${conditions.join(`\nAND `)}\n`;
	}


	/**node
	 * @description Build `GROUP BY` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildGroup()
	{
		let columns = this.processColumns(this.sql_group);

		return `GROUP BY ${columns.join(`,\n`)}\n`;
	}


	/**
	 * @description Build `ORDER BY` string
	 * @private
	 * @memberof Json2mysqlQuery
	 * @returns {string}
	 */
	buildOrder()
	{
		let columns = this.processColumns(this.sql_order);

		return `ORDER BY ${columns.join(`,\n`)}\n`;
	}


	/**
	 * @description Prepares SQl clause statement
	 * @private
	 * @param {Object} conditions
	 * @return {void}
	 */
	processConditions(conditions)
	{
		let list = [];

		for (let i in conditions)
		{
			if (String(i).toUpperCase() == 'AND')
			{
				let conds = [];

				for (let j in conditions[i])
				{
					if (conditions[i][j].length != 3)
					{
						conds.push(this.processConditions(conditions[i][j]));
						break;
					}

					conds.push(this.processCondition(conditions[i][j]));
				}

				list.push(`(${conds.join(' AND ')})\n`);
				continue;
			}
			else if (String(i).toUpperCase() == 'OR')
			{
				let conds = [];

				for (let j in conditions[i])
				{
					if (conditions[i][j].length != 3)
					{
						conds.push(this.processConditions(conditions[i][j]));
						break;
					}

					conds.push(this.processCondition(conditions[i][j]));
				}

				list.push(`(${conds.join(' OR ')})\n`);
				continue;
			}

			list.push(this.processCondition(conditions[i]));
		}

		return list;
	}


	/**
	 * @description Create SQL clauses
	 * @private
	 * @param {array} condition [column, operator, value]
	 * @return {string}
	 */
	processCondition(condition)
	{
		if (condition.length != 3) return null;
		let vals = [];

		switch (condition[1])
		{
			case '=':
				return `${this.identifierOrQuote(condition[0])} = ${this.identifierOrQuote(condition[2])}`;

			case '<=':
				return `${this.identifierOrQuote(condition[0])} <= ${this.identifierOrQuote(condition[2])}`;

			case '>=':
				return `${this.identifierOrQuote(condition[0])} >= ${this.identifierOrQuote(condition[2])}`;

			case '<':
				return `${this.identifierOrQuote(condition[0])} < ${this.identifierOrQuote(condition[2])}`;

			case '>':
				return `${this.identifierOrQuote(condition[0])} > ${this.identifierOrQuote(condition[2])}`;

			case '!=':
				return `${this.identifierOrQuote(condition[0])} != ${this.identifierOrQuote(condition[2])}`;

			case '<>':
				return `${this.identifierOrQuote(condition[0])} != ${this.identifierOrQuote(condition[2])}`;

			case 'is':
				return `${this.identifierOrQuote(condition[0])} IS ${this.identifierOrQuote(condition[2])}`;

			case 'is not':
				return `${this.identifierOrQuote(condition[0])} IS NOT ${this.identifierOrQuote(condition[2])}`;

			case 'between':
				if (typeof condition[2] != 'object') return null;

				for (let val in condition[2])
				{
					vals.push(this.identifierOrQuote(val));
				}

				return `${this.identifierOrQuote(condition[0])} BETWEEN ${vals.join(" AND ")}`;

			case 'in':
				if (typeof condition[2] != 'object') return null;

				for (let i in condition[2])
				{
					vals.push(this.identifierOrQuote(condition[2][i], true));
				}

				return `${this.identifierOrQuote(condition[0])} IN (${vals.join(',')})`;

			case 'not in':
				if (typeof condition[2] != 'object') return null;

				for (let i in condition[2])
				{
					vals.push(this.identifierOrQuote(condition[2][i], true));
				}

				return `${this.identifierOrQuote(condition[0])} NOT IN (${vals.join(',')})`;

			case 'contains':
				return `${this.identifierOrQuote(condition[0])} LIKE '%${this.sqlEscape(condition[2])}%'`;

			case 'begins':
				return `${this.identifierOrQuote(condition[0])} LIKE '${this.sqlEscape(condition[2])}%'`;

			case 'ends':
				return `${this.identifierOrQuote(condition[0])} LIKE '%${this.sqlEscape(condition[2])}'`;

			default:
				return null;
		}
	}


	/**
	 * @description Prepares SQL `select|group|order` columns
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string[]} columns
	 * @return {string[]}
	 */
	processColumns(columns)
	{
		let list = [];

		for (let i in columns)
		{
			if (typeof columns[i] == 'object')
			{
				for (let j in columns[i])
				{
					if (!Array('ASC','DESC').includes(String(columns[i][j]).toUpperCase())) continue;

					list.push(`${this.identifier(j, true)} ${String(columns[i][j]).toUpperCase()}`);
				}
			}
			else
			{
				list.push(this.identifierOrQuote(columns[i], true));
			}
		}

		return list;
	}


	/**
	 * @description Prepares SQL `insert|update` columns
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string[]} columns
	 * @return {string[]}
	 */
	processValues(columns)
	{
		if (typeof columns !== 'object') return;
		let list = [];

		for (let i in columns)
		{
			list[this.identifier(i, true)] = this.identifierOrQuote(columns[i]);
		}

		return list;
	}


	/**
	 * @description Prepares SQL table names
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {Object} columns
	 * @return {Object}
	 */
	table(payload)
	{
		if (typeof payload !== 'object')
		{
			this.sql_identifiers.push(payload);
			return this.identifier(payload, true);
		}

		let obj = {};
		for (let i in payload)
		{
			this.sql_identifiers.push(i);
			this.sql_identifiers.push(payload[i]);

			obj[this.identifier(i, true)] = this.identifier(payload[i], true);

			return obj;
		}
	}





	/**
	 * @description Attempts to make given value sql-injection safe
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string} val
	 * @return {string} Escaped value
	 */
	sqlEscape(val)
	{
		let map = {
			'`'		: '``',
			'\0'	: '\\0',
			'\b'	: '\\b',
			'\t'	: '\\t',
			'\n'	: '\\n',
			'\r'	: '\\r',
			'\x1a'	: '\\Z',
			'\"'	: '\"\"',
			'\''	: '\'\'',
			'\\\\'	: '\\\\'
		};

		for (let key in map)
		{
			let reg = new RegExp(key, 'g');
			val = String(val).replace(reg, map[key]);
		}

		return val;
	}


	/**
	 * @description Determines if value is an identifier or static string to quote
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {string|number} val
	 * @return {string|number}
	 */
	identifierOrQuote(val, force_quote)
	{
		force_quote = force_quote || false;

		// No need to process numbers|null|bool
		switch (typeof val)
		{
			case 'bool':
				return (val) ? 1 : 0;

			case 'number':
				return (force_quote) ? `'${val}'` : val;

			case 'object':
				if (val === null) return 'NULL';
				break;
		}

		// Numeric string params '?'
		if (val === '?' && (this.param_counter in this.sql_params))
		{
			return this.quote(this.sql_params[this.param_counter++], force_quote);
		}

		// Associative string params '?:key'
		let matches = String(val).match(RegExp(/\?\:([a-zA-Z_0-9]+)/, 'g'));
		if (matches != null && (String(matches[0]).replace('?:', '') in this.sql_params))
		{
			return this.quote(this.sql_params[String(matches[0]).replace('?:', '')], force_quote);
		}

		// Column `identifier`
		return this.identifier(val, force_quote);
	}


	/**
	 * @description Prepares value as SQL safe 'string'|number
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {number|string} val
	 * @return {number|string}
	 */
	quote(val, force_quote)
	{
		force_quote = force_quote || false;

		switch (typeof val)
		{
			case 'bool':
				return (val) ? 1 : 0;

			case 'number':
				return force_quote ? `'${val}'` : val;

			case 'object':
				if (val === null) return 'NULL';
				return '';

			case 'string':
			default:
				return `'${this.sqlEscape(val)}'`;
		}
	}


	/**
	 * @description Prepares value as SQL safe `table`.`column` identifiers
	 * @private
	 * @memberof Json2mysqlQuery
	 * @param {number|string} val
	 * @param {bool} force_quote Force back-ticking
	 * @return {string}
	 */
	identifier(val, force_quote)
	{
		let modified = false;
		force_quote = force_quote || false;

		// `table`.`column`
		val = String(val).replace(RegExp(/([a-zA-Z_0-9]+\.[a-zA-Z_0-9*]+)/, 'g'), (match) =>
		{
			let words = String(match).split('.');

			// Validate against list of registered tables
			if ((0 in words) && !this.sql_identifiers.includes(words[0])) return match;

			modified = true;

			for (let i in words)
			{
				if (!Array('*').includes(words[i])) words[i] = `\`${this.sqlEscape(words[i])}\``;
			}

			return words.join('.');
		});

		// 'AS `column`'
		val = String(val).replace(/(as|AS) ([a-zA-Z0-9_]+)/g, (full, as, column) =>
		{
			modified = true;
			return `AS \`${this.sqlEscape(column)}\``
		});

		// `column`
		if (!modified && force_quote && String(val).indexOf(' ') == -1) return `\`${this.sqlEscape(val)}\``;

		return val;
	}
}


module.exports = Json2mysqlQuery;
