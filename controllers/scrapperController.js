const expressAsyncHandler = require("express-async-handler");
const { scrapperFunction } = require("../scrapper");
const PDFDocument = require('pdfkit');

exports.scrapper = expressAsyncHandler(async (req, res) => {
    const { numero, idAcao } = req.body;
    const andamentoProcesso = await scrapperFunction(numero, idAcao);
    if(!andamentoProcesso) throw new Error('Erro no scrapper de andamento')
    console.log("andamento", andamentoProcesso);
        let doc = new PDFDocument({ bufferPages: true });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
            'Content-Length': Buffer.byteLength(pdfData),
            'Content-Type': 'application/pdf',
            'Content-disposition': 'attachment;  filename=stf.pdf',})
            .end(pdfData);    
        });

        let titulos = (titulo) => doc.font('Helvetica-Bold').fontSize(14).text(titulo, {
            align: 'center'
        });
        let underlined = (texto) => doc.font('Helvetica-Bold').fontSize(12).text(texto, {
            underline: true
        })
        let corpo = (corpo) => doc.font('Helvetica').fontSize(12).text(corpo);
        const lineBreak = (vezes = 1) => doc.font('Helvetica').fontSize(12).text('\n'.repeat(vezes));

        const { numeroProcesso, tipoDeProcesso, origem, relator, autorNome, advogadosAutor,
        reus, advogadoReus, andamento } = andamentoProcesso;
        titulos("Número do Processo");
        lineBreak();
        corpo(numeroProcesso);
        lineBreak(2);
        titulos("Tipo de Processo");
        lineBreak();
        corpo(tipoDeProcesso);
        lineBreak(2);
        titulos("Origem");
        lineBreak();
        corpo(origem);
        lineBreak(2);
        titulos("Relator");
        lineBreak()
        corpo(relator);
        lineBreak(2);
        titulos("Nome do Autor");
        lineBreak();
        corpo(autorNome);
        lineBreak(2);
        titulos("Advogados do Autor");
        lineBreak();
        corpo(advogadosAutor);
        lineBreak(2);
        titulos("Réus");
        lineBreak();
        corpo(reus);
        lineBreak(2);
        titulos("Advogados dos Réus");
        lineBreak();
        corpo(advogadoReus);
        lineBreak(2);
        titulos("Andamento do Processo")
        lineBreak();

        andamento.forEach(({ data, acao, detalhe }, index) => {
            let indexAtualizado = index + 1;
            underlined(`${indexAtualizado}) Passo  ${indexAtualizado}`)
            lineBreak();
            corpo(`data: ${data}`);
            lineBreak();
            corpo(`ação: ${acao}`);
            lineBreak();
            corpo(`detalhe: ${detalhe}`);
            lineBreak(2);
        });
        doc.end();
});