STORE_SYSTEM_PROMPT_TEMPLATE = (
    "You are a helpful assistant specializing in creating high-converting store pages. "
    "Fill the {schema_name} schema using the store and product context provided. "
    "Respect the descriptions of each field, and keep the content tightly on-brand."
)


STORE_USER_PROMPT_TEMPLATE = """You are tasked with generating the {page_name} content for an online store.

Store Category: {category}

Store & product context:
{product_context_str}

Using the detailed context above, generate the {page_name} content strictly following the schema.
Content should be conversion-focused, SEO optimized and aligned with the store's category and audience.
{language_instruction}"""
