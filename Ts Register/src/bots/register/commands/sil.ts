export async function silCommand(
    message: any,
    args: string[]
) {
    if (!message.guild) return;

    const member = message.member;

    /*
    ═══════════════════════════════════════
    YETKİ KONTROLÜ
    ═══════════════════════════════════════
    */

    if (!member.permissions.has("ManageMessages")) {
        return message.reply({
            content: "Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısın."
        }).then((msg: any) => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    /*
    ═══════════════════════════════════════
    MİKTAR KONTROLÜ
    ═══════════════════════════════════════
    */

    const amount = Number(args[0]);

    if (!args[0] || !Number.isInteger(amount)) {
        return message.reply({
            content: "Kullanım: `.sil <miktar>`\nÖrnek: `.sil 50`"
        }).then((msg: any) => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    /*
    Discord toplu silmede 1-100 arası destekler
    */

    if (amount < 1 || amount > 100) {
        return message.reply({
            content: "Bir seferde **1 ile 100** arasında mesaj silebilirsin."
        }).then((msg: any) => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    try {

        /*
        Komut mesajını da sil
        */

        await message.delete().catch(() => {});

        /*
        Mesajları sil
        */

        const deleted =
            await message.channel.bulkDelete(
                amount,
                true
            );

        /*
        ═══════════════════════════════════════
        BİLGİ MESAJI
        ═══════════════════════════════════════
        */

        const info =
            await message.channel.send({
                content:
                    `🗑️ **${deleted.size}** mesaj silindi.`
            });

        setTimeout(() => {
            info.delete().catch(() => {});
        }, 3000);

    } catch (error) {

        console.error(
            "[SIL COMMAND]",
            error
        );

        try {

            const errorMessage =
                await message.channel.send({
                    content:
                        "Mesajlar silinirken bir hata oluştu."
                });

            setTimeout(() => {
                errorMessage.delete().catch(() => {});
            }, 5000);

        } catch {}
    }
}