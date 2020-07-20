## YUGA Introduction

<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-Ahmadi/erfan-ahmadi.github.io/master/images/Yugen/YUGA.png" alt="" width="600"/>
</p>

YUGA files are files that contain multiple resources inside them such as Meshes, Textures and Shaders that we call **chunks**.

<details>
  <summary>Asset Type</summary>
  
  ```
  enum class AssetType : uint8_t {
    Unknown         = 0,
    Description     = 1,
    Mesh            = 2,
    Texture         = 3,
    RawFile         = 4,
    Shader          = 5,
    Material        = 6,
    AssetList       = 7,
    .
    .
    .
}
  ```
</details>

## Chunk Header

Those resources each have a "chunk" header before them describing the size of the data that comes after, whether it's compressed or not, revision number and other data that we need or comes in handy.

**Chunk Header** in our header file:

<details>
  <summary>ChunkHeader Struct</summary>
  
  ```
struct ChunkHeader {
    uint8_t signature [4] = {'Y','U','G','A'};  //  0
    uint64_t skip_bytes = 0;                    //  4
    ChunkFlags chunk_flags = ChunkFlags::None;  // 12
    AssetType asset_type = AssetType::Unknown;  // 13
    uint16_t asset_name_size = 0;               // 14   // Includes the NUL
    uint16_t asset_revision = 0;                // 16
    uint16_t asset_tags_size = 0;               // 18   // Includes the NUL
    uint16_t asset_tags_count = 0;              // 20
    uint16_t reserved = 0;                      // 22
    uint32_t asset_uncompressed_size = 0;       // 24
    uint32_t asset_uncompressed_hash = 0;       // 28   // Doesn't cover chunk header or name or tags; only content (i.e. the asset.)
                                                // 32
}
  ```
</details>

## How We Write Assets

We write the assets using a FileWriter Class.

<details>
  <summary>File Writer Interface</summary>
  
  ```
class FileWriter {
    bool ok () const {return m_out.ok();}
    bool in_chunk () const {return m_chunk_state.in_chunk;}
    bool in_tags () const {return m_chunk_state.in_tags;}

    // For LZ4, 0 is the default (low-medium compression, really fast)
    //      1..16 are the HC algorithm, the higher the better and slower compression
    //    -1..-16 are the accelerated algorithm, with lousy compression but even faster speed 
    void set_compression_hint (int level) {m_comp_state.hint = level;}

    bool chunk_start (AssetType asset_type, CBlob const & asset_name, uint16_t asset_rev, ChunkFlags should_compress = ChunkFlags::Compressed);
    bool chunk_start (AssetType asset_type, char const * asset_name, uint16_t asset_rev, ChunkFlags should_compress = ChunkFlags::Compressed);
    bool chunk_emit_tag (CBlob const & name, CBlob const & value = {});
    bool chunk_emit_tag (char const * name, char const * value = nullptr);
    bool chunk_end_tags ();
    bool chunk_emit_data (CBlob const & data);
    ChunkFinishResult chunk_finish ();

    bool chunk_emit_data_texture_start (TextureHeader const & texture_header);
    bool chunk_emit_data_texture_data (CBlob const & data);
};
  ```
</details>


Here is an example on how we write a Shader Asset to a YUGA File:


```
writer.chunk_start(YUGA::AssetType::Shader, asset_name, (uint16_t)asset_revision, YUGA::ChunkFlags::Compressed);
writer.chunk_emit_tag("source_file_name", std::filesystem::path(input_path).filename().string().c_str());
writer.chunk_emit_data(CBlobAliasOf(header));
writer.chunk_emit_data({ blocks.data(), blocks.size() * sizeof(YUGA::ShaderDataBlock) });
writer.chunk_emit_data({ variables.data(), variables.size() * sizeof(YUGA::ShaderDataVariable) });
writer.chunk_emit_data(compiler_result.spirv);
writer.chunk_emit_data({ defines.data(), defines.size() * sizeof(YUGA::ShaderDefine) });
writer.chunk_emit_data({ string_table.data(), string_table.size() });
```

## YUGA Shaders 

**Shader** is an Asset in our Asset System, YUGA.

It contains 
- Compiled Shader (Intermediate Language like SPIR-V) for a Shader Stage.
- Stage, Language, etc. info of the Shader (Info In The HEADER)
- Reflection Info (Blocks and Variables inside the Shader)
- Source Code of the Shader
- Defines 

#### Blocks
All the shader blocks like uniform buffers and textures and samplers.
#### Variables
All the variables in shader buffers 
#### IR
Byte-code, currently in SPIRV
#### Defines
Macro definitions that the shader is compiled with
#### String Table
The memory that we put all our strings in: entry_point_name, source_code, blocks names, defines name and value, variable names.

## Shader Header
It is the header we put at the beginning of our asset memory. (see **asset()** in graph above)

It contains compiled shader's hash, shader stage, shader language, and data that will help us navigate through the raw data to find what we're looking for, such as offsets and sizes.

<details>
  <summary>Shader Header</summary>
  
```
struct ShaderHeader {
    uint64_t        key;
    ShaderStage     stage;
    ShaderLanguage  language;
    ShaderIrFormat  ir_format;
    uint8_t         entry_point_params_count;

    uint32_t        entry_point_name_str_offset;
    uint32_t        source_str_offset;
    uint32_t        ir_bytes;
    uint32_t        string_table_bytes;
    
    uint16_t        entry_point_name_str_bytes;
    uint16_t        source_str_bytes;

    uint16_t        blocks_count;
    uint16_t        variables_count;
    uint16_t        defines_count;
    char            reserved[2];
}
```
</details>

## YUGA::Asset::Shader

And here is the YUGA::Asset::Shader which is fundamentally pointer arithmetics for our asset memory to get requested properties:

We will be using this class to extract reflection info and using it to update our descriptor sets and shader resources.

```
class Shader : public GenericAsset {
public:
    explicit Shader (Metadata const * meta_data, Blob const & asset_mem);

public:
    ShaderHeader const & header() const {return *reinterpret_cast<ShaderHeader const *>(asset());}
    size_t header_size() const {return sizeof(ShaderHeader);}
    Byte const * data () const {return asset() + header_size();}
    size_t data_size () const {return asset_size() - header_size();}
    CBlob blocks() const {return {data() + header().blocks_offset(), header().blocks_bytes()};}
    CBlob variables() const {return {data() + header().variables_offset(), header().variables_bytes()};}
    CBlob ir() const {return {data() + header().ir_offset(), header().ir_bytes};}
    CBlob defines() const {return {data() + header().defines_offset(), header().defines_bytes()};}
    CBlob strings() const {return { data() + header().string_table_offset(), header().string_table_bytes};}
    ShaderDataBlock const * block(uint32_t index) const {
        YUGEN_ASSERT(index < header().blocks_count);
        return blocks().as<ShaderDataBlock const>() + index;
    } 
    ShaderDataVariable const * variable(uint32_t index) const {
        YUGEN_ASSERT(index < header().variables_count);
        return variables().as<ShaderDataVariable const>() + index;
    }
    ShaderDefine const * define(uint32_t index) const {
        YUGEN_ASSERT(index < header().defines_count);
        return defines().as<ShaderDefine const>() + index;
    }
    char const * block_name(ShaderDataBlock const * block) const {
        return string(block->name_str_offset);
    }
    char const * block_name(uint32_t index) const {
        return string(block(index)->name_str_offset);
    }
    char const * variable_name(ShaderDataBlock const * variable) const {
        return string(variable->name_str_offset);
    }
    char const * variable_name(uint32_t index) const {
        return string(variable(index)->name_str_offset);
    }
    char const * define_name(uint32_t index) const {
        return string(define(index)->name_str_offset);
    }
    char const * define_value(uint32_t index) const {
        return string(define(index)->value_str_offset);
    }
    char const * string(uint32_t offset) const {
        YUGEN_ASSERT(offset < header().string_table_bytes);
        return strings().as<char const>() + offset;
    }
    char const * entry_point_name() const {return string(header().entry_point_name_str_offset);}
    char const * source() const {return string(header().source_str_offset);}
private:
};
```
