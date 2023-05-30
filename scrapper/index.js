const puppeteer = require('puppeteer');
require("dotenv").config();

function timeout(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

module.exports = { 
    scrapperFunction: async function(numero, idAcao) {
    console.log('começando o scrap.');
    // const chromeArgs = [
    //     '--disable-background-timer-throttling',
    //     '--disable-backgrounding-occluded-windows',
    //     '--disable-renderer-backgrounding'
    //   ];
      const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
      });

    try {
        
        //   const context = await browser.createIncognitoBrowserContext();
        
        //   if (context.isIncognito()) {
        //     console.log('Modo navegação anônima ativado')
        //   }
        
          const page = await browser.newPage();   
          await page.goto('https://portal.stf.jus.br/');
          await page.type('input[name="pesquisaPrincipalClasseNumero"]', numero);
          const buttonSelector = '#btnPesquisar';
          await page.click(buttonSelector);
          await timeout(2000);
          const acceptCookiesSelector = '#acceptCookies';
          await page.click(acceptCookiesSelector);
          const linkIdAcao = await page.$x(`//a[contains(., '${idAcao}')]`);
            if (linkIdAcao) {
            await linkIdAcao[0].click();
            } else {
                alert("LINK NÃO ENCONTRADO")
            }
          await page.waitForNavigation();
          await timeout(2200);
         const processoPartesSelector = '.processo-partes'
         const processoPartes = await page.$$eval(processoPartesSelector,
            elements => elements.map(item => item.textContent));
         const numeroProcessoSelector = '.processo-rotulo';
         const processoClasseSelector = '.processo-classe';
         const processoDadosSelector = '.processo-dados';
    
         async function evalAndLog(selector) {
            const array = await page.$$eval(selector, elements => elements.map(item => item.textContent));
            console.log(selector, array);
         }
    
         async function arraySelectors(selector) {
            const array = await page.$$eval(selector, elements => elements.map(item => item.textContent));
            return array;
         }
    
          const arrayProcessoRotulo = await arraySelectors(numeroProcessoSelector);
          const stringProcessoRotulo = arrayProcessoRotulo[0];
          const [_, numeroProcesso ] = stringProcessoRotulo.split(':');
          const numeroProcessoTrimmed = numeroProcesso.trim();
          const arrayClasseDeProcesso = await arraySelectors(processoClasseSelector);
          const tipoDeProcesso = arrayClasseDeProcesso[1];
          const arrayProcessoDados = await arraySelectors(processoDadosSelector);
          const relatorString = arrayProcessoDados[1];
          const [__, relator] = relatorString.split(':');
          const relatorTrimmed = relator.trim();
          const origemString = arrayProcessoDados[0];
          const [___, origem] = origemString.split(':');
          const origemFormatada = origem.replace('\n', '');
          const origemTrimmed = origemFormatada.trim();
     
         let autorNome = processoPartes[1];
         let advogadosAutor = processoPartes[3];
         let reus = processoPartes[5];
         let advogadoReus = processoPartes[7].trim();
    
         const andamentoDetalheArray = await arraySelectors(".andamento-detalhe");

         function cleanStr(str) {
            let lines = str.split('\n');
            for (let i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trim();
            }
            lines = lines.filter(element => element !== '');
            lines.join(' ');
            return lines;
        }

        let arrayDatas = andamentoDetalheArray.map(element => {
            let item = cleanStr(element);
            return {
                data: item[0],
                acao: item[1],
                detalhe: item[2] || '(sem detalhe)'
            }
        })
       
         let objetoFinal = {
            numeroProcesso: numeroProcessoTrimmed,
            tipoDeProcesso,
            origem: origemTrimmed,
            relator: relatorTrimmed,
            autorNome,
            advogadosAutor,
            reus,
            advogadoReus,
            andamento: arrayDatas
         }
         return objetoFinal;
        } catch(err) {
            throw new Error('Erro na função scrap', err);
        } finally {
            await browser.close();
        }
    }
}



    
    