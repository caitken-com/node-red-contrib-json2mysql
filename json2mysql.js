const SimpleSqlBuilder = require('@caitken-com/simple-sql-builder');


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
		node.query = null;
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
			let topic = msg.topic || null;

			// Apply template to payload
			if (node.template !== "")
			{
				try
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
				catch (error)
				{
					return node.warn(error);
				}
			}

			// Payload validation
			if (!('payload' in msg)) return node.send(null);
			if (typeof msg.payload != 'object') return node.send(null);
			if (!('return' in msg.payload)) msg.payload.return = 'string';

			// Populate query generator
			try
			{
				node.query = SimpleSqlBuilder.fromJson(msg.payload);
			}
			catch (err)
			{
				return node.warn('err1: ' + err);
			}

			// Generate query and either execute or return query string
			switch (msg.payload.return)
			{
				// Return query string (good for debugging)
				case 'string':
					try
					{
						node.send({'payload': node.query, 'topic': topic});
					}
					catch (err)
					{
						node.warn(err);
					}
					break;

				// An array of rows, where each row is an associative array
				case 'array':
					node.server.query(node.query)
					.then((result) =>
					{
						node.send({
							'payload': {...result.payload},
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// An array of rows, where each row is a numeric array
				case 'array-num':
					node.server.query(node.query)
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
							'payload': rows,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// A single row, as an associative array
				case 'row':
					node.server.query(node.query)
					.then((result) =>
					{
						for (let i in result.payload)
						{
							node.send({
								'payload': {...result.payload[i]},
								'insertId': result.insertId,
								'affectedRows': result.affectedRows,
								'changedRows': result.changedRows,
								'topic': topic,
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
					node.server.query(node.query)
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
							'payload': row,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns _array_ of `{identifier: value}` _object_ pairs where the identifier is the first column in the result set, and the value is the second
				case 'map':
					node.server.query(node.query)
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
							'payload': rows,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns _object_ of `{identifier: {col: vaal, ...}}`, where the identifier is the first column in the result set, and the value an _object_ of `{name:value}` pairs
				case 'map-array':
					node.server.query(node.query)
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
							'payload': rows,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// A single value, of the first column of the first row
				case 'val':
					node.server.query(node.query)
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
							'payload': val,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				// Returns an _array_ from the first column of each row
				case 'col':
					node.server.query(node.query)
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
							'payload': rows,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
						});
					})
					.catch((err) =>
					{
						node.warn(err);
					});
					break;

				case 'count':
					node.server.query(node.query)
					.then((result) =>
					{
						node.send({
							'payload': result.payload.length,
							'insertId': result.insertId,
							'affectedRows': result.affectedRows,
							'changedRows': result.changedRows,
							'topic': topic,
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
