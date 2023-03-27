const Json2mysqlQuery = require('./Json2mysqlQuery');


/**
 * @description Converts JSON to MYSQL
 * @package json2mysql
 * @param {Object} RED
 * @author Christopher Aitken
 * @version 1.0
 */
module.exports = function(RED)
{
	function Json2mysqlNode(config)
	{
		RED.nodes.createNode(this, config);

		const node = this;
		node.query = new Json2mysqlQuery();
		node.server = RED.nodes.getNode(config.server);
		node.template = config.template;


		/**
		 * @description Handle incoming messages
		 * @memberof Json2mysqlNode
		 * @param {json} msg [msg.topic => (string), msg.payload => (json)]
		 * @return {void}
		 */
		node.on('input', function(msg)
		{
			// Apply template to payload
			if (node.template !== "")
			{
				let incoming = JSON.parse(JSON.stringify(msg.payload));
				msg.payload = JSON.parse(node.template);

				// Override template with incoming values
				if (typeof incoming == 'object')
				{
					for (let key in incoming)
					{
						msg.payload[key] = JSON.parse(JSON.stringify(incoming[key]));
					}
				}
			}

			// Payload validation
			if (!('payload' in msg)) return node.send(null);
			if (typeof msg.payload != 'object') return node.send(null);
			if (!('return' in msg.payload)) msg.payload.return = 'string';

			// Clear query generator
			node.query.reset();

			// Populate query generator
			if ('select' in msg.payload)
			{
				try
				{
					node.query.select(msg.payload.select);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('insert' in msg.payload)
			{
				try
				{
					node.query.insert(msg.payload.insert);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}


			if ('update' in msg.payload)
			{
				try
				{
					node.query.update(msg.payload.update);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('delete' in msg.payload)
			{
				try
				{
					node.query.delete(msg.payload.delete);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('joins' in msg.payload)
			{
				try
				{
					node.query.joins(msg.payload.joins);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('where' in msg.payload)
			{
				try
				{
					node.query.where(msg.payload.where);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('having' in msg.payload)
			{
				try
				{
					node.query.having(msg.payload.having);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('order' in msg.payload)
			{
				try
				{
					node.query.order(msg.payload.order);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('group' in msg.payload)
			{
				try
				{
					node.query.group(msg.payload.group);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('limit' in msg.payload)
			{
				try
				{
					node.query.limit(msg.payload.limit);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			if ('params' in msg.payload)
			{
				try
				{
					node.query.params(msg.payload.params);
				}
				catch (err)
				{
					return node.warn(err);
				}
			}

			// Generate query and either execute or return query string
			switch (msg.payload.return)
			{
				// Return query string (good for debugging)
				case 'string':
					try
					{
						node.send({payload: node.query.build()});
					}
					catch (err)
					{
						node.warn(err);
					}
					break;

				// An array of rows, where each row is an associative array
				case 'array':
					node.server.query(node.query.build())
					.then((result) =>
					{
						node.send(result);
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// An array of rows, where each row is a numeric array
				case 'array-num':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let rows = [];

						for (let i in result.payload)
						{
							let cols = [];

							for (let j in result.payload[i])
							{
								cols.push(result.payload[i][j]);
							}

							rows.push(cols);
						}

						node.send({
							payload: rows,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// A single row, as an associative array
				case 'row':
					node.server.query(node.query.build())
					.then((result) =>
					{
						for (let i in result.payload)
						{
							node.send({
								payload: {...result.payload[i]},
								insertId: result.insertId,
								affectedRows: result.affectedRows,
								changedRows: result.changedRows,
							});

							break;
						}
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// A single row, as a numeric array
				case 'row-num':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let row = [];

						for (let i in result.payload)
						{
							for (let j in result.payload[i])
							{
								row.push(result.payload[i][j]);
							}

							break;
						}

						node.send({
							payload: row,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns _array_ of `{identifier: value}` _object_ pairs where the identifier is the first column in the result set, and the value is the second
				case 'map':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let rows = [];

						for (let i in result.payload)
						{
							let cols = [];
							let count = 0;

							for (let j in result.payload[i])
							{
								cols.push(result.payload[i][j]);

								if (++count == 2) break;
							}

							rows.push({[cols[0]]: cols[1]});
						}

						node.send({
							payload: rows,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns _object_ of `{identifier: {col: vaal, ...}}`, where the identifier is the first column in the result set, and the value an _object_ of `{name:value}` pairs
				case 'map-array':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let rows = {};

						for (let i in result.payload)
						{
							let id = null;
							let cols = {};
							let count = 0;

							for (let j in result.payload[i])
							{
								if (count++ == 0)
								{
									id = result.payload[i][j];
									continue;
								}

								cols[j] = result.payload[i][j];
							}

							rows[id] = cols;
						}

						node.send({
							payload: rows,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// A single value, of the first column of the first row
				case 'val':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let val = null;

						for (let i in result.payload)
						{
							for (let j in result.payload[i])
							{
								val = result.payload[i][j];
								break;
							}
							break;
						}

						node.send({
							payload: val,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns an _array_ from the first column of each row
				case 'col':
					node.server.query(node.query.build())
					.then((result) =>
					{
						let rows = [];

						for (let i in result.payload)
						{
							let count = 0;
							for (let j in result.payload[i])
							{
								if (count++ > 0) continue;
								rows.push(result.payload[i][j]);
							}
						}

						node.send({
							payload: rows,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				case 'count':
					node.server.query(node.query.build())
					.then((result) =>
					{
						node.send({
							payload: result.payload.length,
							insertId: result.insertId,
							affectedRows: result.affectedRows,
							changedRows: result.changedRows,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;
			}
		});
	}

	RED.nodes.registerType('json2mysql', Json2mysqlNode);
}
