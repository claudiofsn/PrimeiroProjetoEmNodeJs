const { response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid")

const app = express();
app.use(express.json());

const costumers = [];

//Middleware
function verifiyIfAccountExistsCPF(request, response, next) {
    const { cpf } = request.headers;
    const costumer = costumers.find(costumer => costumer.cpf === cpf);

    if (!costumer) {
        return response.status(400).json({ error: "Costumer not found" });
    }

    request.costumer = costumer

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const costumerAlreadyExist = costumers.some((costumer) => costumer.cpf === cpf);

    if (costumerAlreadyExist) {
        return response.status(400).json({ error: "Costumer already exists!" })
    }

    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send();
})


app.get("/statement", verifiyIfAccountExistsCPF, (request, response) => {
    const { costumer } = request;

    return response.json(costumer.statement);
})

app.post("/deposit", verifiyIfAccountExistsCPF, (request, response) => {
    const { description, amount } = request.body;
    const { costumer } = request;
    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    }

    costumer.statement.push(statementOperation);

    return response.status(201).send();

});

app.post("/withdraw", verifiyIfAccountExistsCPF, (request, response) => {
    const { amount } = request.body;
    const { costumer } = request;

    const balance = getBalance(costumer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: "Insificient funds" });
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    };

    costumer.statement.push(statementOperation);

    return response.status(201).send();
})

app.get("/statement/date", verifiyIfAccountExistsCPF, (request, response) => {
    const { costumer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = costumer.statement.filter((statement) =>
        statement.createdAt.toDateString() ===
        new Date(dateFormat).toDateString());

    return response.json(statement);
});

app.put("/account", verifiyIfAccountExistsCPF, (request, response) => {
    const { name } = request.body;
    const { costumer } = request;

    costumer.name = name;

    return response.status(201).send()
});

app.get("/account", verifiyIfAccountExistsCPF, (request, response) => {
    const { costumer } = request;

    return response.json(costumer)
});

app.delete("/account", verifiyIfAccountExistsCPF, (request, response) => {
    const { costumer } = request;

    //splice
    costumers.splice(costumer, 1);

    return response.status(200).json(costumers);
});

app.get("/balance", verifiyIfAccountExistsCPF, (request, response) => {
    const { costumer } = request;

    const balance = getBalance(costumer.statement);

    return response.json(balance);
});

app.listen(3344);