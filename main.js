const { ipcMain, ipcRenderer } = require('electron');
var app = require('electron').app;


const ipc = require("electron").ipcMain;
const db = require("./lib/connection").db
var BrowserWindow = require('electron').BrowserWindow;
//Hocam Bazı Şeyleri Bilerek Türkçeye Çevirmedim
app.on('ready', function () {//uygulama hazır olduğunda çalışacak olan kod bloğu
    mainWindow = new BrowserWindow({//Yeni Pencere Oluşturduk
        show: false, minWidth: 1500, minHeight: 1500, webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })
    mainWindow.maximize()
    mainWindow.minWidth
    mainWindow.show()

    mainWindow.loadURL('file://' + __dirname + '/anasayfa.html');//ilk açılacak sayfa

    ipcMain.on("StokGiris", (event, data) => {//anasayfa.html den StokGiris geldiğinde  
        var mevcutadet;//mevcutadet Adında Değişken Oluşturduk Elimizdeki Mevcut Ürünü Öğrenebilmek İçin
        db.query("SELECT * FROM urunler", (GirisHata, GirisSonuc, GirisAlanlar) => {//Urunler Tablosunndaki Veri lerimizi GirisSonuc Adındaki Değişkende Tutuyoruz
            
            var i = 0; // Arama Yaparken kullanacağımız i Değişkinimizi oluşturup 0'a Eşitliyoruz.
            for (const x of GirisSonuc) {// Veri Tabanındaki Satırları Döngüye Alıtoruz
                if (x.Barkod == data.girisbarkod) {//Veri Tabanındaki Ürünlerin Barkod Numarası Anasayfa.html den Barkod İse Çalışacak Kod Bloğu
                    mevcutadet = parseInt(x.Miktar) + parseInt(data.girisadet);//Elimizdeki Mevcut Adete Anasayfa.html den gelen Adeti Ekliyoruz
                    var GirisVeritabanı = `UPDATE urunler SET miktar = ${mevcutadet} WHERE barkod = ${data.girisbarkod} `;//Aradığımız Barkoda Ait Olan Miktarı Güncelliyoruz
                    db.query(GirisVeritabanı, function (GirisHata, GirisSonuc) {//Veri Tabanına Kaydediyoruz
                        console.log(GirisHata);//Kayıt Ederkenki Hataları Konsola Yazdırıyoruz
                        console.log(GirisSonuc);//Kayıt Ettiğimizde ki Sonuçları Yazıyrouz
                    })
                    i++;//Ürün Bulundu Anlamına Geliyor
                    break;//Döngüden Çıkıcak
                }
            }
            if (i == 0) {//Ürün Bulunamadı Demek
                event.reply("donus", "yok");//Eğer Ürün Bulunamamışsa Ekrana Uyarı Verecek
            }
        })
    })

    ipcMain.on("StokSatis", (olay, SatisVeri) => {
        var mevcutadet;//İstenen barkoddaki ürünün Elimizdeki Miktarı
        db.query("SELECT * FROM urunler", (SatisHata, SatisSonuc, SatisAlanlar) => {//Veritabanında Girilen Barkodda ki Ürün varmı diye Sorgulama yapıcaz
            var i = 0;// i değişkeni Oluşturup 0'a Eşitledik Arama Yaparken Kullanıcaz
            for (const x of SatisSonuc) {//Veritabanımzda Ürünleri Döngüye Aldık(Lazım Olan Barkodlu Ürüne Erişebilmek İçin)
                if (x.Barkod == SatisVeri.satisbarkod) {//Anasayfadan Gelen Barkod Bilgisiyle Veritabanından Gelen Ürünün Barkodu Eşitse
                    
                    
                    if (parseInt(x.Miktar) >= parseInt(SatisVeri.satisadet)) {//Elimizde Satılacak Olan Miktardan Fazlası Var İse Satış İşlemi Gerçekleşicek Stoğun Eksi ye Düşmemesine Dikkat Ettim
                        
                        mevcutadet = parseInt(x.Miktar) - parseInt(SatisVeri.satisadet);//Gelen İfadeler String Olduğu İçin int e Çevirdim

                        var Satisveritabanı= `UPDATE urunler SET miktar = ${mevcutadet} WHERE barkod = ${SatisVeri.satisbarkod} `;//Veritabanımızda Yeni Stoğumuzla Güncelleme Yaptık
                        db.query(Satisveritabanı, function (satishata, satissonuc) {//Veritabanına Yazdırdık
                            console.log(satishata);//Kaydederken bir Hata Alırsak Konsola Yazdırıyoruz
                            console.log(satissonuc);//Kaydederken Bilgileri Burda Görücez
                        })
                        i++;//i yi 1 arttırdık
                        break;//Döngüden Çıktık
                    }
                   
                }

            }
            if (i == 0) {//i 0'a Eşitse
                console.log("Bulunamadı");//Konsola Bulunamadı Yazacak(Veri Tabanında yoksa)
                olay.reply("donus", "fazla");//Veritabanında olmadığı için swal fire uyarısı verecek
            }
        })
    })

    ipcMain.on("YeniGiris", (olay, yeniveri) => {//yenigiris anahtarıyla gelen bilgiler yeniveri içinde tutulur
        var yeniurun= "INSERT INTO urunler (barkod ,isim ,miktar , fiyat ) VALUES ?";//Veritabanında oluşturucağımız yeni ürünümüz
        var degerler= 
        [
            [yeniveri.yenikod, yeniveri.yeniboyut, yeniveri.yeniadet, yeniveri.yenifiyat]//anasayfa.html den gelen yeni ürünün bilgileri
        ]
        db.query(yeniurun, [degerler], function (hata, sonuclar) {//veritabanına kaydettik
            console.log(hata);//kaydederken oluşan hataları yazdırdık
            console.log(sonuclar);//kayıt sonuçlarını yazdırdık
        })

    })


    db.query("SELECT * FROM urunler", (hata, sonuc, alanlar) => {//urunler tablosunu seçtik
        

        ipcMain.on("sorgu", (olay, veri) => {//anasayfa.html den sorgu keyin de gelen barkod numarasını veri değişkeninde tuttuk
            var i = 0;// i yi 0'a Eşitledik
            for (const x of sonuc) //veritabanından çektiğimiz satırları döngüye soktuk
            {
                if (x.Barkod == veri) {//veritabanımızdan gelen barkod numaraları anasayfa.html den gelen sorgulanacak Barkod numarasına Eşitse
                    var urun = { barkod: x.Barkod, isim: x.İsim, miktar: x.Miktar, fiyat: x.Fiyat, };//ürünün özelliklerini urun değişkeninde tutuyoruz.
                    olay.reply("donus", urun);//Sorgu Ekranında Gösterebilmek için donus key inde urun leri gönderdik.
                    i++;//Bulunduğu için i yi artırdık.
                    break;//Döngüden çıktık
                }
            }
            if (i == 0) {//i 0 sa ürün bulunamaıştır.
                console.log("Bulunamadı");//konsol ekranında bulunamadı yazar.
                olay.reply("donus", "yok");//Cevap olarak yok gönderilir bu da anasayfada uyarı penceresi oluşturur.
            }
        })

    })

});

