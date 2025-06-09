const supabase = require("../config/supabaseClient");

const uploadImage = async (file, bucket = "imagem.evento") => {
  try {
    // Gera um nome único para o arquivo
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Faz o upload do arquivo para o bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtém a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Garante que a URL pública seja acessível
    const url = new URL(publicUrl);
    url.searchParams.set('t', Date.now()); // Adiciona um timestamp para evitar cache
    return url.toString();
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw error;
  }
};

module.exports = {
  uploadImage
}; 