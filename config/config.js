module.exports = {
    server_port:3300,
    db_url:'mongodb://localhost:27017/junhyukPay',
    db_schemas: [
        {file:'./user_schema', collection:'user1', schemaName:'UserSchema', modelName:'UserModel'}
    ],
    route_info: []                           
};