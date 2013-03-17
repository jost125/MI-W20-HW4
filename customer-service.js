var http = require('http');

var CustomerStorage = function() {
	this._customers = {};
	this._size = 0;

	this.checkExists = function(customerId) {
		if (this._customers[customerId] === undefined) {
			throw 'Customer not found';
		}
	};

	this.add = function (customer) {
		var id = this._size;
		customer.id = id;
		this._customers[id] = customer;
		this._size++;
		return id;
	};

	this.remove = function (customerId) {
		this._customers[customerId] !== undefined && delete this._customers[customerId];
	};

	this.get = function (customerId) {
		this.checkExists(customerId);
		return this._customers[customerId];
	};
};

var Customer = function(name) {
	this.id = null;
	this.name = name;
};

var CustomerService = function(customerStorage) {
	this._customerStorage = customerStorage;

	this.remove = function(customerId) {
		this._customerStorage.checkExists(customerId);
		var that = this;
		setTimeout(function() {
			that._customerStorage.remove(customerId)
		}, 10000);
	};

	this.get = function(customerId) {
		return this._customerStorage.get(customerId);
	};
};

var Server = function(customerService) {
	this._customerService = customerService;

	var that = this;

	this._server = http.createServer(function (request, response) {
		var matches = request.url.match(/\/customer\/(\d)+/);
		if (matches) {
			var customerId = matches[1];
			try {
				switch (request.method) {
					case 'GET':
						var customer = that._customerService.get(customerId);
						that._response(response, {message: customer}, 200);
						break;
					case 'DELETE':
						that._customerService.remove(customerId);
						that._response(response, {message: 'Queued for deletion'}, 202);
						break;
					default:
						var header = {
							'Content-Type': 'application/json',
							'Allow': 'GET, DELETE'
						};
						that._response(response, {message: 'Method not allowed'}, 405, header);
						break;
				}
			} catch (e) {
				that._response(response, {message: e}, 404);
			}
		} else {
			that._response(response, {message: 'Source not found'}, 404);
		}
	});

	this._response = function(response, data, code, header) {
		response.writeHead(code, header ? header : {"Content-Type": "application/json"});
		response.end(JSON.stringify({data: data}));
	};

	this.run = function() {
		this._server.listen(8000);
	}
};

var customerStorage = new CustomerStorage();
customerStorage.add(new Customer('John Doe'));
customerStorage.add(new Customer('Arthur Dent'));

var customerService = new CustomerService(customerStorage);
var server = new Server(customerService);
server.run();
