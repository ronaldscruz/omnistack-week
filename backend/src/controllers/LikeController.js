const Dev = require("../models/Dev");

module.exports = {
    async store(request, response){
        // Retornando parametros da URL(recebe like) e do Header(dá like)
        const targetDevId = request.params.devId;
        const loggedDevId = request.headers.user_id;

        const loggedDev = await Dev.findById(loggedDevId);
        const targetDev = await Dev.findById(targetDevId);

        // Retornar erro se o Dev 'likado' não existir
        if(!targetDev){
            return response.status(400).json({ error: "Esse dev não existe ;/" });
        }

        // Se o usuário ja deu like nesse dev, retornar erro
        if(loggedDev.likes.includes(targetDev._id) || loggedDev.dislikes.includes(targetDev._id)){
            return response.status(400).json({ error: "Você já deu like nesse dev!" });
        }

        // MATCH!
        if(targetDev.likes.includes(loggedDev._id)){
            const loggedSocket = request.connectedUsers[loggedDevId];
            const targetSocket = request.connectedUsers[targetDevId];

            if(loggedSocket){
                request.io.to(loggedSocket).emit("match", targetDev);
            }

            if(targetSocket){
                request.io.to(targetSocket).emit("match", loggedDev);
            }
        }

        // Caso tudo esteja certo, adicionar like ao array de Likes
        loggedDev.likes.push(targetDevId);
        await loggedDev.save();

        return response.json(loggedDev);
    }
};